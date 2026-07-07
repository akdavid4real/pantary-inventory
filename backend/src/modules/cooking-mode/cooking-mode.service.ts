import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CookingSessionStatus, PantryAdjustmentType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CompleteCookingSessionDto, StartCookingSessionDto } from './dto/cooking-mode.dto';

@Injectable()
export class CookingModeService {
  constructor(private readonly prisma: PrismaService) {}

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

  async complete(userId: string, sessionId: string, dto: CompleteCookingSessionDto) {
    const session = await this.prisma.cookingSession.findFirst({
      where: { id: sessionId, userId, status: CookingSessionStatus.ACTIVE },
      include: {
        recipe: {
          include: { ingredients: { include: { ingredient: true } } },
        },
        steps: true,
      },
    });
    if (!session) throw new NotFoundException('Active cooking session not found.');

    const scale = session.servings / Math.max(1, session.recipe.servings);

    await this.prisma.$transaction(async (tx) => {
      for (const required of session.recipe.ingredients) {
        const neededQuantity = required.quantity * scale;
        const pantryItems = await tx.pantryItem.findMany({
          where: {
            userId,
            ingredientId: required.ingredientId,
            unit: required.unit,
            quantity: { gt: 0 },
          },
          orderBy: [{ expiryDate: 'asc' }, { createdAt: 'asc' }],
        });

        const availableQuantity = pantryItems.reduce((sum, item) => sum + item.quantity, 0);
        if (availableQuantity < neededQuantity) {
          throw new BadRequestException(`Not enough ${required.ingredient.name} in pantry.`);
        }

        let remaining = neededQuantity;
        for (const pantryItem of pantryItems) {
          if (remaining <= 0) break;
          const used = Math.min(pantryItem.quantity, remaining);
          await tx.pantryItem.update({
            where: { id: pantryItem.id },
            data: { quantity: pantryItem.quantity - used },
          });
          await tx.pantryItemLog.create({
            data: {
              userId,
              pantryItemId: pantryItem.id,
              ingredientId: required.ingredientId,
              type: PantryAdjustmentType.USED,
              quantity: used,
              unit: required.unit,
              reason: `Cooked ${session.recipe.name}`,
            },
          });
          remaining -= used;
        }
      }

      await tx.cookingSessionStep.updateMany({
        where: { sessionId },
        data: { completedAt: new Date() },
      });

      await tx.cookingSession.update({
        where: { id: sessionId },
        data: {
          status: CookingSessionStatus.COMPLETED,
          completedAt: new Date(),
          currentStep: session.steps.length || session.currentStep,
        },
      });

      await tx.nutritionLog.create({
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
      });
    });

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
