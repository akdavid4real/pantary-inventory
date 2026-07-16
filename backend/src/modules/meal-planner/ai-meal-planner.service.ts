import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { MealType, RecipeModerationStatus, RecipeStatus } from '@prisma/client';
import { EnvironmentService } from '../../common/config/environment.service';
import { resolveGeminiModel } from '../../common/config/gemini-model';
import {
  GEMINI_MEAL_PLAN_TIMEOUT_MS,
  geminiInteractionRequestOptions,
} from '../../common/config/gemini-request';
import { addDays, endOfWeek, startOfDay, startOfWeek } from '../../common/utils/date.utils';
import { normalizeText } from '../../common/utils/string.utils';
import { PrismaService } from '../../prisma/prisma.service';
import { RecipeMatcherService } from '../recipe-matcher/recipe-matcher.service';
import { AiMealPlanPreviewDto, ApplyAiMealPlanDto } from './dto/meal-planner.dto';

const allowedMealTypes: MealType[] = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER];
type GeminiChoice = {
  recipeId: string;
  dayOffset: number;
  mealType: MealType;
  reason: string;
};

type Candidate = {
  recipeId: string;
  recipeName: string;
  category?: string | null;
  region?: string | null;
  imageUrl?: string | null;
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  matchPercentage: number;
  ingredientPresencePercentage: number;
  canCookNow: boolean;
  missingIngredients: Array<{ name: string }>;
  presentIngredients: Array<{ name: string }>;
  nutrition: {
    caloriesPerServing: number;
    proteinPerServing: number;
    carbsPerServing: number;
    fatPerServing: number;
  };
};

@Injectable()
export class AiMealPlannerService {
  private readonly logger = new Logger(AiMealPlannerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly matcher: RecipeMatcherService,
    private readonly config: EnvironmentService,
  ) {}

  async preview(userId: string, dto: AiMealPlanPreviewDto) {
    const selectedDate = dto.weekDate ? new Date(dto.weekDate) : new Date();
    const weekStart = startOfWeek(selectedDate);
    const mealCount = dto.mealCount ?? 7;
    const [matches, preferences, existingMeals, expiringItems] = await Promise.all([
      this.matcher.fromPantry(userId) as unknown as Promise<Candidate[]>,
      this.prisma.userPreference.findUnique({ where: { userId } }),
      this.prisma.mealPlanEntry.findMany({
        where: { userId, plannedDate: { gte: weekStart, lte: endOfWeek(weekStart) } },
        select: { plannedDate: true, mealType: true },
      }),
      this.prisma.pantryItem.findMany({
        where: {
          userId,
          quantity: { gt: 0 },
          expiryDate: { gte: new Date(), lte: endOfWeek(weekStart) },
        },
        select: { ingredient: { select: { name: true } } },
      }),
    ]);

    const blockedIngredients = [
      ...(preferences?.allergies ?? []),
      ...(preferences?.avoidedIngredients ?? []),
    ].map(normalizeText).filter(Boolean);
    const recipeIngredientTerms = blockedIngredients.length
      ? await this.loadRecipeIngredientTerms(matches.map((match) => match.recipeId))
      : new Map<string, string[]>();
    const expiringIngredients = expiringItems.map((item) => item.ingredient.name);
    const expiringNames = expiringIngredients.map(normalizeText);
    const candidates = matches
      .filter((match) => !this.containsBlockedIngredient(
        match,
        blockedIngredients,
        recipeIngredientTerms.get(match.recipeId) ?? [],
      ))
      .filter((match) => !preferences?.maxCookingMinutes ||
        match.prepTimeMinutes + match.cookTimeMinutes <= preferences.maxCookingMinutes)
      .sort((left, right) =>
        this.expiringIngredientCount(right, expiringNames) - this.expiringIngredientCount(left, expiringNames),
      )
      .slice(0, 30);

    if (!candidates.length) {
      throw new BadRequestException(
        'No approved recipes match your saved allergies, avoided ingredients, and cooking-time preference.',
      );
    }

    const occupiedSlots = new Set(existingMeals.map((entry) =>
      `${this.dayOffset(weekStart, entry.plannedDate)}:${entry.mealType}`,
    ));
    const availableSlots = this.availableSlots(occupiedSlots);
    const requestedCount = Math.min(mealCount, availableSlots.length);
    if (!requestedCount) {
      throw new BadRequestException('This week has no open breakfast, lunch, or dinner slots.');
    }

    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    const model = resolveGeminiModel(this.config.get<string>('GEMINI_MODEL'));
    let source: 'GEMINI' | 'PLATESENSE_FALLBACK' = 'PLATESENSE_FALLBACK';
    let choices: GeminiChoice[] = [];
    let summary = 'PlateSense built a balanced plan from your strongest pantry matches.';

    if (apiKey) {
      try {
        choices = await this.generateWithGemini({
          apiKey,
          model,
          candidates,
          preferences: {
            dietaryPreference: preferences?.dietaryPreference,
            calorieGoal: preferences?.calorieGoal,
            proteinGoal: preferences?.proteinGoal,
            carbsGoal: preferences?.carbsGoal,
            fatGoal: preferences?.fatGoal,
            maxCookingMinutes: preferences?.maxCookingMinutes,
            preferNigerianMeals: preferences?.preferNigerianMeals,
            cookingComfort: preferences?.cookingComfort,
            defaultServings: preferences?.defaultServings,
          },
          expiringIngredients,
          availableSlots,
          requestedCount,
          weekStart,
        });
        source = 'GEMINI';
        summary = 'Gemini arranged real Pantry-to-Plate recipes around your pantry and saved preferences.';
      } catch (error) {
        this.logger.warn(`Gemini meal planning failed; using PlateSense fallback: ${this.errorMessage(error)}`);
      }
    }

    const validChoices = this.validateChoices(choices, candidates, availableSlots, requestedCount);
    const completedChoices = this.completeWithFallback(validChoices, candidates, availableSlots, requestedCount);
    const candidateById = new Map(candidates.map((candidate) => [candidate.recipeId, candidate]));
    const servings = Math.max(1, preferences?.defaultServings ?? 2);

    return {
      source,
      model: source === 'GEMINI' ? model : null,
      summary,
      weekStart: weekStart.toISOString(),
      entries: completedChoices.map((choice) => {
        const recipe = candidateById.get(choice.recipeId)!;
        return {
          recipeId: recipe.recipeId,
          plannedDate: this.plannedDate(weekStart, choice.dayOffset),
          mealType: choice.mealType,
          servings,
          reason: choice.reason,
          pantryMatchPercentage: recipe.matchPercentage,
          ingredientPresencePercentage: recipe.ingredientPresencePercentage,
          canCookNow: recipe.canCookNow,
          recipe: {
            id: recipe.recipeId,
            name: recipe.recipeName,
            imageUrl: recipe.imageUrl,
            category: recipe.category,
            region: recipe.region,
            prepTimeMinutes: recipe.prepTimeMinutes,
            cookTimeMinutes: recipe.cookTimeMinutes,
            caloriesPerServing: recipe.nutrition.caloriesPerServing,
          },
        };
      }),
    };
  }

  async apply(userId: string, dto: ApplyAiMealPlanDto) {
    const recipeIds = [...new Set(dto.entries.map((entry) => entry.recipeId))];
    const recipes = await this.prisma.recipe.findMany({
      where: {
        id: { in: recipeIds },
        isPublished: true,
        status: RecipeStatus.PUBLISHED,
        moderationStatus: RecipeModerationStatus.APPROVED,
      },
      select: { id: true },
    });
    if (recipes.length !== recipeIds.length) {
      throw new BadRequestException('One or more suggested recipes are no longer available.');
    }

    const firstDate = new Date(dto.entries[0].plannedDate);
    const weekStart = startOfWeek(firstDate);
    const weekEnd = endOfWeek(firstDate);
    const requestedSlots = new Set<string>();
    for (const entry of dto.entries) {
      const date = new Date(entry.plannedDate);
      if (date < weekStart || date > weekEnd) {
        throw new BadRequestException('All AI meal suggestions must belong to the same week.');
      }
      const slot = `${date.toISOString().slice(0, 10)}:${entry.mealType}`;
      if (requestedSlots.has(slot)) {
        throw new BadRequestException('The AI plan contains the same meal slot more than once.');
      }
      requestedSlots.add(slot);
    }

    const existing = await this.prisma.mealPlanEntry.findMany({
      where: { userId, plannedDate: { gte: weekStart, lte: weekEnd } },
      select: { plannedDate: true, mealType: true },
    });
    const conflict = existing.some((entry) =>
      requestedSlots.has(`${entry.plannedDate.toISOString().slice(0, 10)}:${entry.mealType}`),
    );
    if (conflict) {
      throw new BadRequestException('A suggested meal slot is no longer empty. Generate a fresh plan and try again.');
    }

    return this.prisma.$transaction(dto.entries.map((entry) =>
      this.prisma.mealPlanEntry.create({
        data: {
          userId,
          recipeId: entry.recipeId,
          plannedDate: new Date(entry.plannedDate),
          mealType: entry.mealType,
          servings: entry.servings,
          notes: `AI plan: ${entry.reason}`,
        },
        include: { recipe: true },
      }),
    ));
  }

  private async generateWithGemini(input: {
    apiKey: string;
    model: string;
    candidates: Candidate[];
    preferences: unknown;
    expiringIngredients: string[];
    availableSlots: Array<{ dayOffset: number; mealType: MealType }>;
    requestedCount: number;
    weekStart: Date;
  }) {
    // Do not rely on constructor httpOptions.timeout — Interactions ignores it.
    const client = new GoogleGenAI({ apiKey: input.apiKey });
    const candidateIds = input.candidates.map((candidate) => candidate.recipeId);
    const response = await client.interactions.create(
      {
        model: input.model,
        store: false,
        system_instruction: [
          'You are the Nigerian-aware meal planning assistant for Pantry-to-Plate.',
          'Select only recipe IDs and meal slots supplied by the application.',
          'Prioritize pantry coverage, ingredients that may expire, nutrition variety, cooking-time limits, and Nigerian food preferences.',
          'Never invent a recipe, ingredient, date, or slot. Keep each reason under 140 characters.',
        ].join(' '),
        input: JSON.stringify({
          task: `Choose exactly ${input.requestedCount} meals for the week beginning ${input.weekStart.toISOString().slice(0, 10)}.`,
          preferences: input.preferences,
          expiringIngredients: input.expiringIngredients,
          availableSlots: input.availableSlots,
          candidates: input.candidates.map((candidate) => ({
            recipeId: candidate.recipeId,
            name: candidate.recipeName,
            category: candidate.category,
            region: candidate.region,
            totalMinutes: candidate.prepTimeMinutes + candidate.cookTimeMinutes,
            pantryMatchPercentage: candidate.matchPercentage,
            ingredientPresencePercentage: candidate.ingredientPresencePercentage,
            canCookNow: candidate.canCookNow,
            missingIngredients: candidate.missingIngredients.map((ingredient) => ingredient.name),
            nutrition: candidate.nutrition,
          })),
        }),
        generation_config: {
          thinking_level: 'minimal',
          max_output_tokens: 2048,
          temperature: 0.3,
        },
        response_format: {
          type: 'text',
          mime_type: 'application/json',
          schema: {
            type: 'object',
            properties: {
              entries: {
                type: 'array',
                minItems: input.requestedCount,
                maxItems: input.requestedCount,
                items: {
                  type: 'object',
                  properties: {
                    recipeId: { type: 'string', enum: candidateIds },
                    dayOffset: { type: 'integer', minimum: 0, maximum: 6 },
                    mealType: { type: 'string', enum: allowedMealTypes },
                    reason: { type: 'string' },
                  },
                  required: ['recipeId', 'dayOffset', 'mealType', 'reason'],
                  additionalProperties: false,
                },
              },
            },
            required: ['entries'],
            additionalProperties: false,
          },
        },
      },
      geminiInteractionRequestOptions(GEMINI_MEAL_PLAN_TIMEOUT_MS),
    );
    if (!response.output_text) throw new Error('Gemini returned no structured output.');
    const parsed = JSON.parse(response.output_text) as { entries?: GeminiChoice[] };
    return parsed.entries ?? [];
  }

  private validateChoices(
    choices: GeminiChoice[],
    candidates: Candidate[],
    slots: Array<{ dayOffset: number; mealType: MealType }>,
    count: number,
  ) {
    const candidateIds = new Set(candidates.map((candidate) => candidate.recipeId));
    const allowedSlots = new Set(slots.map((slot) => `${slot.dayOffset}:${slot.mealType}`));
    const usedSlots = new Set<string>();
    return choices.filter((choice) => {
      const slot = `${choice.dayOffset}:${choice.mealType}`;
      const valid = candidateIds.has(choice.recipeId) && allowedSlots.has(slot) &&
        !usedSlots.has(slot) && typeof choice.reason === 'string';
      if (valid) usedSlots.add(slot);
      return valid;
    }).slice(0, count);
  }

  private completeWithFallback(
    choices: GeminiChoice[],
    candidates: Candidate[],
    slots: Array<{ dayOffset: number; mealType: MealType }>,
    count: number,
  ) {
    const result = [...choices];
    const usedSlots = new Set(result.map((choice) => `${choice.dayOffset}:${choice.mealType}`));
    const usedRecipes = new Set(result.map((choice) => choice.recipeId));
    for (const slot of slots) {
      if (result.length >= count) break;
      const slotKey = `${slot.dayOffset}:${slot.mealType}`;
      if (usedSlots.has(slotKey)) continue;
      const recipe = candidates.find((candidate) => !usedRecipes.has(candidate.recipeId)) ??
        candidates[result.length % candidates.length];
      result.push({
        recipeId: recipe.recipeId,
        dayOffset: slot.dayOffset,
        mealType: slot.mealType,
        reason: recipe.canCookNow
          ? 'You already have the ingredients needed for this meal.'
          : `${recipe.ingredientPresencePercentage}% of its ingredients are already represented in your pantry.`,
      });
      usedSlots.add(slotKey);
      usedRecipes.add(recipe.recipeId);
    }
    return result;
  }

  private availableSlots(occupied: Set<string>) {
    const slots: Array<{ dayOffset: number; mealType: MealType }> = [];
    for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
      for (const mealType of [MealType.DINNER, MealType.LUNCH, MealType.BREAKFAST]) {
        if (!occupied.has(`${dayOffset}:${mealType}`)) slots.push({ dayOffset, mealType });
      }
    }
    return slots;
  }

  private async loadRecipeIngredientTerms(recipeIds: string[]) {
    const recipes = await this.prisma.recipe.findMany({
      where: { id: { in: recipeIds } },
      select: {
        id: true,
        ingredients: {
          select: { ingredient: { select: { name: true, allergens: true } } },
        },
      },
    });
    return new Map(recipes.map((recipe) => [
      recipe.id,
      recipe.ingredients.flatMap((entry) => [
        normalizeText(entry.ingredient.name),
        ...entry.ingredient.allergens.map(normalizeText),
      ]),
    ]));
  }

  private containsBlockedIngredient(candidate: Candidate, blocked: string[], fullIngredientTerms: string[]) {
    if (!blocked.length) return false;
    const ingredientNames = [...candidate.presentIngredients, ...candidate.missingIngredients]
      .map((ingredient) => normalizeText(ingredient.name))
      .concat(fullIngredientTerms);
    return blocked.some((blockedName) =>
      ingredientNames.some((name) => name.includes(blockedName) || blockedName.includes(name)),
    );
  }

  private expiringIngredientCount(candidate: Candidate, expiringNames: string[]) {
    const ingredients = [...candidate.presentIngredients, ...candidate.missingIngredients]
      .map((ingredient) => normalizeText(ingredient.name));
    return expiringNames.filter((expiringName) => ingredients.some((name) => name === expiringName)).length;
  }

  private dayOffset(weekStart: Date, date: Date) {
    return Math.round((startOfDay(date).getTime() - startOfDay(weekStart).getTime()) / 86_400_000);
  }

  private plannedDate(weekStart: Date, dayOffset: number) {
    const date = addDays(weekStart, dayOffset);
    date.setHours(12, 0, 0, 0);
    return date.toISOString();
  }

  private errorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Unknown Gemini API error';
  }
}
