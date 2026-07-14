import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { addDays } from '../../common/utils/date.utils';
import { normalizeIngredientName, normalizeText } from '../../common/utils/string.utils';
import { SimulateRecipeMatchDto } from './dto/recipe-matcher.dto';
import { convertIngredientQuantity } from '../../common/utils/unit.utils';
import { RecipeModerationStatus, RecipeStatus } from '@prisma/client';
import { MeasurementProfilesService } from '../measurement-profiles/measurement-profiles.service';

type ActiveMeasurementProfile = Awaited<ReturnType<MeasurementProfilesService['active']>>;

export type MatchPantryItem = {
  ingredientId: string;
  quantity: number;
  unit: string;
  ingredient: {
    id: string;
    name: string;
    aliases?: { normalized: string }[];
    conversions?: { fromUnit: string; toUnit: string; multiplier: number }[];
  };
};

type PantryLookup = {
  items: MatchPantryItem[];
  byIngredientId: Map<string, MatchPantryItem[]>;
  byName: Map<string, MatchPantryItem[]>;
};

@Injectable()
export class RecipeMatcherService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly measurementProfiles?: MeasurementProfilesService,
  ) {}

  async fromPantry(userId: string) {
    const [pantry, profile] = await Promise.all([
      this.getUserPantryLookup(userId),
      this.measurementProfiles?.active(userId),
    ]);
    return this.fromPantryItems(pantry.items, profile);
  }

  async fromPantryItems(items: MatchPantryItem[], profile?: ActiveMeasurementProfile) {
    const recipes = await this.getRecipesForMatching();
    const pantry = this.buildLookup(items.filter((item) => item.quantity > 0));
    return recipes.map((recipe) => this.scoreRecipe(recipe, pantry, profile)).sort((a, b) => b.matchPercentage - a.matchPercentage);
  }

  async checkRecipe(userId: string, recipeId: string) {
    const [pantry, recipe, profile] = await Promise.all([
      this.getUserPantryLookup(userId),
      this.prisma.recipe.findUnique({ where: { id: recipeId }, include: this.matchInclude() }),
      this.measurementProfiles?.active(userId),
    ]);
    if (!recipe) throw new NotFoundException('Recipe not found.');
    return this.scoreRecipe(recipe, pantry, profile);
  }

  async expiringFirst(userId: string, days = 7) {
    const expiringItems = await this.prisma.pantryItem.findMany({
      where: {
        userId,
        quantity: { gt: 0 },
        expiryDate: {
          gte: new Date(),
          lte: addDays(new Date(), days),
        },
      },
      include: { ingredient: true },
    });

    const expiringIds = new Set(expiringItems.map((item) => item.ingredientId));
    const matches = await this.fromPantry(userId);

    return matches
      .map((match) => {
        const expiringIngredientCount = match.requiredIngredientIds.filter((id) => expiringIds.has(id)).length;
        return {
          ...match,
          expiringIngredientCount,
          priorityScore: match.matchPercentage + expiringIngredientCount * 8,
        };
      })
      .filter((match) => match.expiringIngredientCount > 0)
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }

  async simulate(dto: SimulateRecipeMatchDto) {
    const simulatedItems: MatchPantryItem[] = dto.ingredients.map((item, index) => {
      const name = normalizeIngredientName(item.name);
      return {
        ingredientId: `simulated-${index}`,
        quantity: item.quantity ?? 1,
        unit: item.unit ?? 'unit',
        ingredient: {
          id: `simulated-${index}`,
          name,
          aliases: [{ normalized: normalizeText(name) }],
        },
      };
    });

    const lookup = this.buildLookup(simulatedItems);
    const recipes = await this.getRecipesForMatching();
    return recipes.map((recipe) => this.scoreRecipe(recipe, lookup)).sort((a, b) => b.matchPercentage - a.matchPercentage);
  }

  private async getRecipesForMatching() {
    return this.prisma.recipe.findMany({
      where: {
        isPublished: true,
        status: RecipeStatus.PUBLISHED,
        moderationStatus: RecipeModerationStatus.APPROVED,
      },
      include: this.matchInclude(),
    });
  }

  private async getUserPantryLookup(userId: string): Promise<PantryLookup> {
    const items = await this.prisma.pantryItem.findMany({
      where: { userId, quantity: { gt: 0 } },
      include: { ingredient: { include: { aliases: true, conversions: true } } },
    });
    return this.buildLookup(items);
  }

  private buildLookup(items: MatchPantryItem[]): PantryLookup {
    const byIngredientId = new Map<string, MatchPantryItem[]>();
    const byName = new Map<string, MatchPantryItem[]>();

    for (const item of items) {
      byIngredientId.set(item.ingredientId, [...(byIngredientId.get(item.ingredientId) ?? []), item]);
      byName.set(normalizeText(item.ingredient.name), [...(byName.get(normalizeText(item.ingredient.name)) ?? []), item]);
      for (const alias of item.ingredient.aliases ?? []) {
        byName.set(alias.normalized, [...(byName.get(alias.normalized) ?? []), item]);
      }
    }

    return { items, byIngredientId, byName };
  }

  private scoreRecipe(recipe: any, pantry: PantryLookup, profile?: ActiveMeasurementProfile) {
    const requiredIngredients = recipe.ingredients.filter((item: any) => !item.isOptional);
    const totalRequired = requiredIngredients.length || 1;
    const availableIngredients = [] as Array<Record<string, unknown>>;
    const missingIngredients = [] as Array<Record<string, unknown>>;
    const presentIngredients = [] as Array<Record<string, unknown>>;
    const insufficientIngredients = [] as Array<Record<string, unknown>>;
    const requiredIngredientIds = requiredIngredients.map((item: any) => item.ingredientId);

    for (const required of requiredIngredients) {
      const pantryMatches = pantry.byIngredientId.get(required.ingredientId) ?? pantry.byName.get(normalizeText(required.ingredient.name)) ?? [];
      const conversions = profile && this.measurementProfiles
        ? this.measurementProfiles.applyProfile(required.ingredientId, required.ingredient.conversions ?? [], profile)
        : required.ingredient.conversions ?? [];
      const sameUnitQuantity = pantryMatches.reduce((sum, item) => {
        const converted = convertIngredientQuantity(
          item.quantity,
          item.unit,
          required.unit,
          conversions.length ? conversions : item.ingredient.conversions ?? [],
        );
        return sum + (converted ?? 0);
      }, 0);

      if (pantryMatches.length > 0) {
        presentIngredients.push({
          ingredientId: required.ingredientId,
          name: required.ingredient.name,
          requiredQuantity: required.quantity,
          unit: required.unit,
          availableQuantity: sameUnitQuantity,
        });
      }

      if (pantryMatches.length > 0 && sameUnitQuantity >= required.quantity) {
        availableIngredients.push({
          ingredientId: required.ingredientId,
          name: required.ingredient.name,
          requiredQuantity: required.quantity,
          unit: required.unit,
          availableQuantity: sameUnitQuantity,
        });
      } else {
        const shortage = {
          ingredientId: required.ingredientId,
          name: required.ingredient.name,
          requiredQuantity: required.quantity,
          unit: required.unit,
          availableQuantity: sameUnitQuantity,
          missingQuantity: Math.max(0, required.quantity - sameUnitQuantity),
        };
        missingIngredients.push(shortage);
        if (pantryMatches.length > 0) insufficientIngredients.push(shortage);
      }
    }

    const matchPercentage = Math.round((availableIngredients.length / totalRequired) * 100);
    const ingredientPresencePercentage = Math.round((presentIngredients.length / totalRequired) * 100);

    return {
      recipeId: recipe.id,
      recipeName: recipe.name,
      category: recipe.category,
      region: recipe.region,
      imageUrl: recipe.imageUrl,
      servings: recipe.servings,
      cookTimeMinutes: recipe.cookTimeMinutes,
      prepTimeMinutes: recipe.prepTimeMinutes,
      matchPercentage,
      ingredientPresencePercentage,
      canCookNow: missingIngredients.length === 0,
      availableIngredients,
      missingIngredients,
      presentIngredients,
      insufficientIngredients,
      requiredIngredientIds,
      nutrition: {
        caloriesPerServing: recipe.caloriesPerServing,
        proteinPerServing: recipe.proteinPerServing,
        carbsPerServing: recipe.carbsPerServing,
        fatPerServing: recipe.fatPerServing,
      },
    };
  }

  private matchInclude() {
    return {
      ingredients: {
        include: {
          ingredient: {
            include: { aliases: true, conversions: true },
          },
        },
      },
      tags: { include: { tag: true } },
    };
  }
}
