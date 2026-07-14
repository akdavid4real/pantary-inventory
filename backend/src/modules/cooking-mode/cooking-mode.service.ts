import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CookingSessionStatus, PantryAdjustmentType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CompleteCookingSessionDto, StartCookingSessionDto } from './dto/cooking-mode.dto';
import { convertIngredientQuantity } from '../../common/utils/unit.utils';
import { MeasurementProfilesService } from '../measurement-profiles/measurement-profiles.service';

@Injectable()
export class CookingModeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly measurementProfiles?: MeasurementProfilesService,
  ) {}

  async start(userId: string, recipeId: string, dto: StartCookingSessionDto) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { steps: { orderBy: { stepNumber: 'asc' } } },
    });
    if (!recipe) throw new NotFoundException('Recipe not found.');

    return this.prisma.cookingSession.create({
      data: {
        userId,
        recipeId,
        servings: dto.servings ?? 1,
        steps: {
          create: recipe.steps.map((step) => ({
            recipeStepId: step.id,
            stepNumber: step.stepNumber,
            instruction: step.instruction,
          })),
        },
      },
      include: { recipe: true, steps: { orderBy: { stepNumber: 'asc' } } },
    });
  }

  async getSession(userId: string, sessionId: string) {
    const session = await this.prisma.cookingSession.findFirst({
      where: { id: sessionId, userId },
      include: { recipe: true, steps: { orderBy: { stepNumber: 'asc' } } },
    });
    if (!session) throw new NotFoundException('Cooking session not found.');
    return session;
  }

  async next(userId: string, sessionId: string) {
    const session = await this.getSession(userId, sessionId);
    const maxStep = session.steps.length || 1;
    const nextStep = Math.min(maxStep, session.currentStep + 1);

    await this.prisma.cookingSessionStep.updateMany({
      where: { sessionId, stepNumber: session.currentStep },
      data: { completedAt: new Date() },
    });

    return this.prisma.cookingSession.update({
      where: { id: sessionId },
      data: { currentStep: nextStep },
      include: { recipe: true, steps: { orderBy: { stepNumber: 'asc' } } },
    });
  }

  async previous(userId: string, sessionId: string) {
    const session = await this.getSession(userId, sessionId);
    const previousStep = Math.max(1, session.currentStep - 1);
    return this.prisma.cookingSession.update({
      where: { id: sessionId },
      data: { currentStep: previousStep },
      include: { recipe: true, steps: { orderBy: { stepNumber: 'asc' } } },
    });
  }

  async usagePreview(userId: string, sessionId: string) {
    const session = await this.prisma.cookingSession.findFirst({
      where: { id: sessionId, userId, status: CookingSessionStatus.ACTIVE },
      include: { recipe: { include: { ingredients: { include: { ingredient: { include: { conversions: true } } } } } } },
    });
    if (!session) throw new NotFoundException('Active cooking session not found.');
    const scale = session.servings / Math.max(1, session.recipe.servings);
    const requiredIngredients = session.recipe.ingredients.filter((item) => !item.isOptional);
    const stocks = await this.prisma.pantryItem.findMany({
      where: { userId, ingredientId: { in: requiredIngredients.map((item) => item.ingredientId) }, quantity: { gt: 0 } },
    });
    const profile = this.measurementProfiles ? await this.measurementProfiles.active(userId) : null;
    const items = requiredIngredients.map((required) => {
      const conversions = profile ? this.measurementProfiles!.applyProfile(required.ingredientId, required.ingredient.conversions, profile) : required.ingredient.conversions;
      const requiredQuantity = required.quantity * scale;
      const availableQuantity = stocks
        .filter((item) => item.ingredientId === required.ingredientId)
        .reduce((sum, item) => sum + (convertIngredientQuantity(item.quantity, item.unit, required.unit, conversions) ?? 0), 0);
      return { ingredientId: required.ingredientId, name: required.ingredient.name, unit: required.unit, requiredQuantity, availableQuantity, missingQuantity: Math.max(0, requiredQuantity - availableQuantity) };
    });
    return { sessionId, servings: session.servings, canComplete: items.every((item) => item.missingQuantity === 0), items };
  }

  async complete(userId: string, sessionId: string, dto: CompleteCookingSessionDto) {
    const session = await this.prisma.cookingSession.findFirst({
      where: { id: sessionId, userId, status: CookingSessionStatus.ACTIVE },
      include: {
        recipe: {
          include: { ingredients: { include: { ingredient: { include: { conversions: true } } } } },
        },
        steps: true,
      },
    });
    if (!session) throw new NotFoundException('Active cooking session not found.');

    const scale = session.servings / Math.max(1, session.recipe.servings);
    const overrides = new Map((dto.actualUsage ?? []).map((item) => [item.ingredientId, item]));
    for (const override of dto.actualUsage ?? []) {
      const required = session.recipe.ingredients.find((item) => item.ingredientId === override.ingredientId);
      if (!required) throw new BadRequestException('Actual usage contains an ingredient that is not in this recipe.');
      if (required.unit.toLowerCase() !== override.unit.toLowerCase()) throw new BadRequestException(`Actual usage for ${required.ingredient.name} must use ${required.unit}.`);
    }

    const requiredIngredients = session.recipe.ingredients.filter((item) => !item.isOptional);
    const pantryItems = await this.prisma.pantryItem.findMany({
      where: { userId, ingredientId: { in: requiredIngredients.map((item) => item.ingredientId) }, quantity: { gt: 0 } },
      orderBy: [{ expiryDate: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }],
    });
    const operations = [] as any[];
    const profile = this.measurementProfiles ? await this.measurementProfiles.active(userId) : null;
    for (const required of requiredIngredients) {
        const conversions = profile ? this.measurementProfiles!.applyProfile(required.ingredientId, required.ingredient.conversions, profile) : required.ingredient.conversions;
        const neededQuantity = overrides.get(required.ingredientId)?.quantity ?? required.quantity * scale;
        if (neededQuantity === 0) continue;
        const stocks = pantryItems.filter((item) => item.ingredientId === required.ingredientId && convertIngredientQuantity(item.quantity, item.unit, required.unit, conversions) !== null);
        const availableQuantity = stocks.reduce((sum, item) => sum + (convertIngredientQuantity(item.quantity, item.unit, required.unit, conversions) ?? 0), 0);
        if (availableQuantity < neededQuantity) {
          throw new BadRequestException(`Not enough ${required.ingredient.name} in pantry. Required ${neededQuantity} ${required.unit}; available ${availableQuantity} ${required.unit}.`);
        }

        let remaining = neededQuantity;
        for (const pantryItem of stocks) {
          if (remaining <= 0) break;
          const availableInRequiredUnit = convertIngredientQuantity(pantryItem.quantity, pantryItem.unit, required.unit, conversions) ?? 0;
          const usedInRequiredUnit = Math.min(availableInRequiredUnit, remaining);
          const usedInPantryUnit = convertIngredientQuantity(usedInRequiredUnit, required.unit, pantryItem.unit, conversions) ?? 0;
          operations.push(this.prisma.pantryItem.update({
            where: { id: pantryItem.id },
            data: { quantity: Number(Math.max(0, pantryItem.quantity - usedInPantryUnit).toFixed(6)) },
          }));
          operations.push(this.prisma.pantryItemLog.create({
            data: {
              userId,
              pantryItemId: pantryItem.id,
              ingredientId: required.ingredientId,
              type: PantryAdjustmentType.USED,
              quantity: usedInPantryUnit,
              unit: pantryItem.unit,
              reason: `Cooked ${session.recipe.name}`,
            },
          }));
          remaining -= usedInRequiredUnit;
        }
      }

      operations.push(this.prisma.cookingSessionStep.updateMany({
        where: { sessionId },
        data: { completedAt: new Date() },
      }));

      operations.push(this.prisma.cookingSession.update({
        where: { id: sessionId },
        data: {
          status: CookingSessionStatus.COMPLETED,
          completedAt: new Date(),
          currentStep: session.steps.length || session.currentStep,
        },
      }));

      operations.push(this.prisma.nutritionLog.create({
        data: {
          userId,
          recipeId: session.recipeId,
          logDate: new Date(),
          mealType: dto.mealType,
          servings: session.servings,
          calories: session.recipe.caloriesPerServing * session.servings,
          protein: session.recipe.proteinPerServing * session.servings,
          carbs: session.recipe.carbsPerServing * session.servings,
          fat: session.recipe.fatPerServing * session.servings,
          source: 'cooking-mode',
        },
      }));
    await this.prisma.$transaction(operations);

    return this.getSession(userId, sessionId);
  }

  async cancel(userId: string, sessionId: string) {
    await this.getSession(userId, sessionId);
    return this.prisma.cookingSession.update({
      where: { id: sessionId },
      data: { status: CookingSessionStatus.CANCELLED, cancelledAt: new Date() },
      include: { recipe: true, steps: { orderBy: { stepNumber: 'asc' } } },
    });
  }

}
