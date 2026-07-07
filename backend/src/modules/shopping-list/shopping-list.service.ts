import { Injectable, NotFoundException } from '@nestjs/common';
import { PantryAdjustmentType, ShoppingItemStatus, ShoppingListStatus, StorageLocation } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { endOfWeek, startOfWeek } from '../../common/utils/date.utils';
import { GenerateFromMealPlanDto, UpdateShoppingListItemDto } from './dto/shopping-list.dto';

type Requirement = {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  recipeId?: string;
};

@Injectable()
export class ShoppingListService {
  constructor(private readonly prisma: PrismaService) {}

  async generateFromRecipe(userId: string, recipeId: string, servings = 1) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { ingredients: { include: { ingredient: true } } },
    });
    if (!recipe) throw new NotFoundException('Recipe not found.');

    const scale = servings / Math.max(1, recipe.servings);
    const requirements = recipe.ingredients.map((item) => ({
      ingredientId: item.ingredientId,
      name: item.ingredient.name,
      quantity: item.quantity * scale,
      unit: item.unit,
      recipeId: recipe.id,
    }));

    return this.createMissingList(userId, requirements, `Shopping list for ${recipe.name}`);
  }

  async generateFromMealPlan(userId: string, dto: GenerateFromMealPlanDto) {
    const start = dto.startDate ? new Date(dto.startDate) : startOfWeek();
    const end = dto.endDate ? new Date(dto.endDate) : endOfWeek(start);

    const entries = await this.prisma.mealPlanEntry.findMany({
      where: {
        userId,
        recipeId: { not: null },
        plannedDate: { gte: start, lte: end },
      },
      include: {
        recipe: {
          include: {
            ingredients: { include: { ingredient: true } },
          },
        },
      },
    });

    const requirements: Requirement[] = [];
    for (const entry of entries) {
      if (!entry.recipe) continue;
      const scale = entry.servings / Math.max(1, entry.recipe.servings);
      for (const item of entry.recipe.ingredients) {
        requirements.push({
          ingredientId: item.ingredientId,
          name: item.ingredient.name,
          quantity: item.quantity * scale,
          unit: item.unit,
          recipeId: entry.recipe.id,
        });
      }
    }

    return this.createMissingList(userId, requirements, 'Weekly meal plan shopping list');
  }

  current(userId: string) {
    return this.prisma.shoppingList.findFirst({
      where: { userId, status: ShoppingListStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
      include: { items: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async findOne(userId: string, id: string) {
    const list = await this.prisma.shoppingList.findFirst({
      where: { id, userId },
      include: { items: { orderBy: { createdAt: 'asc' } } },
    });
    if (!list) throw new NotFoundException('Shopping list not found.');
    return list;
  }

  async updateItem(userId: string, itemId: string, dto: UpdateShoppingListItemDto) {
    const item = await this.prisma.shoppingListItem.findFirst({
      where: { id: itemId, shoppingList: { userId } },
    });
    if (!item) throw new NotFoundException('Shopping list item not found.');

    return this.prisma.shoppingListItem.update({
      where: { id: itemId },
      data: dto,
    });
  }

  async complete(userId: string, listId: string) {
    const list = await this.findOne(userId, listId);
    const boughtItems = list.items.filter((item) => item.status === ShoppingItemStatus.BOUGHT && item.ingredientId);

    await this.prisma.$transaction(async (tx) => {
      for (const item of boughtItems) {
        const existing = await tx.pantryItem.findFirst({
          where: {
            userId,
            ingredientId: item.ingredientId!,
            unit: item.unit,
          },
        });

        if (existing) {
          await tx.pantryItem.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + item.quantity },
          });
          await tx.pantryItemLog.create({
            data: {
              userId,
              pantryItemId: existing.id,
              ingredientId: item.ingredientId,
              type: PantryAdjustmentType.BOUGHT,
              quantity: item.quantity,
              unit: item.unit,
              reason: 'Shopping list completed',
            },
          });
        } else {
          const created = await tx.pantryItem.create({
            data: {
              userId,
              ingredientId: item.ingredientId!,
              quantity: item.quantity,
              unit: item.unit,
              storageLocation: StorageLocation.PANTRY,
            },
          });
          await tx.pantryItemLog.create({
            data: {
              userId,
              pantryItemId: created.id,
              ingredientId: item.ingredientId,
              type: PantryAdjustmentType.BOUGHT,
              quantity: item.quantity,
              unit: item.unit,
              reason: 'Shopping list completed',
            },
          });
        }
      }

      await tx.shoppingList.update({
        where: { id: listId },
        data: { status: ShoppingListStatus.COMPLETED },
      });
    });

    return this.findOne(userId, listId);
  }

  private async createMissingList(userId: string, requirements: Requirement[], title: string) {
    const merged = this.mergeRequirements(requirements);
    const pantryItems = await this.prisma.pantryItem.findMany({ where: { userId, quantity: { gt: 0 } } });

    const missing = merged
      .map((required) => {
        const availableQuantity = pantryItems
          .filter((item) => item.ingredientId === required.ingredientId && item.unit.toLowerCase() === required.unit.toLowerCase())
          .reduce((sum, item) => sum + item.quantity, 0);

        const missingQuantity = Math.max(0, required.quantity - availableQuantity);
        return { ...required, missingQuantity };
      })
      .filter((item) => item.missingQuantity > 0);

    return this.prisma.shoppingList.create({
      data: {
        userId,
        title,
        items: {
          create: missing.map((item) => ({
            ingredientId: item.ingredientId,
            recipeId: item.recipeId,
            name: item.name,
            quantity: item.missingQuantity,
            unit: item.unit,
          })),
        },
      },
      include: { items: true },
    });
  }

  private mergeRequirements(requirements: Requirement[]) {
    const map = new Map<string, Requirement>();
    for (const requirement of requirements) {
      const key = `${requirement.ingredientId}:${requirement.unit.toLowerCase()}`;
      const existing = map.get(key);
      if (existing) {
        existing.quantity += requirement.quantity;
      } else {
        map.set(key, { ...requirement });
      }
    }
    return [...map.values()];
  }
}
