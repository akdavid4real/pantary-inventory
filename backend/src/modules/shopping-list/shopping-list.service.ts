import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PantryAdjustmentType, ShoppingItemSource, ShoppingItemStatus, ShoppingListStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { endOfWeek, startOfWeek } from '../../common/utils/date.utils';
import { CompleteShoppingListDto, CreateManualShoppingListItemDto, GenerateFromMealPlanDto, UpdateShoppingListItemDto } from './dto/shopping-list.dto';
import { convertIngredientQuantity } from '../../common/utils/unit.utils';
import { MeasurementProfilesService } from '../measurement-profiles/measurement-profiles.service';

type Requirement = { ingredientId: string; name: string; quantity: number; unit: string; recipeId?: string; conversions?: Array<{ fromUnit: string; toUnit: string; multiplier: number }> };

@Injectable()
export class ShoppingListService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly measurementProfiles?: MeasurementProfilesService,
  ) {}

  async generateFromRecipe(userId: string, recipeId: string, servings = 1) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { ingredients: { include: { ingredient: { include: { conversions: true } } } } },
    });
    if (!recipe) throw new NotFoundException('Recipe not found.');
    const scale = servings / Math.max(1, recipe.servings);
    return this.refreshActiveList(userId, recipe.ingredients.map((item) => ({
      ingredientId: item.ingredientId,
      name: item.ingredient.name,
      quantity: item.quantity * scale,
      unit: item.unit,
      recipeId: recipe.id,
      conversions: item.ingredient.conversions,
    })), `Shopping list for ${recipe.name}`);
  }

  async generateFromMealPlan(userId: string, dto: GenerateFromMealPlanDto) {
    const start = dto.startDate ? new Date(dto.startDate) : startOfWeek();
    const end = dto.endDate ? new Date(dto.endDate) : endOfWeek(start);
    const entries = await this.prisma.mealPlanEntry.findMany({
      where: { userId, recipeId: { not: null }, plannedDate: { gte: start, lte: end } },
      include: { recipe: { include: { ingredients: { include: { ingredient: { include: { conversions: true } } } } } } },
    });
    const requirements: Requirement[] = [];
    for (const entry of entries) {
      if (!entry.recipe) continue;
      const scale = entry.servings / Math.max(1, entry.recipe.servings);
      for (const item of entry.recipe.ingredients) requirements.push({
        ingredientId: item.ingredientId,
        name: item.ingredient.name,
        quantity: item.quantity * scale,
        unit: item.unit,
        recipeId: entry.recipe.id,
        conversions: item.ingredient.conversions,
      });
    }
    return this.refreshActiveList(userId, requirements, 'Weekly meal plan shopping list');
  }

  current(userId: string) {
    return this.prisma.shoppingList.findFirst({
      where: { userId, status: ShoppingListStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
      include: { items: { orderBy: { createdAt: 'asc' }, include: { ingredient: { include: { conversions: true } }, sourceRecipe: true } } },
    });
  }

  async findOne(userId: string, id: string) {
    const list = await this.prisma.shoppingList.findFirst({
      where: { id, userId },
      include: { items: { orderBy: { createdAt: 'asc' }, include: { ingredient: { include: { conversions: true } }, sourceRecipe: true } } },
    });
    if (!list) throw new NotFoundException('Shopping list not found.');
    return list;
  }

  async createManualItem(userId: string, dto: CreateManualShoppingListItemDto) {
    const current = await this.current(userId);
    const listId = current?.id ?? (await this.prisma.shoppingList.create({ data: { userId, title: 'My shopping list' } })).id;
    if (dto.ingredientId) {
      const ingredient = await this.prisma.ingredient.findUnique({ where: { id: dto.ingredientId } });
      if (!ingredient) throw new NotFoundException('Ingredient not found.');
    }
    return this.prisma.shoppingListItem.create({
      data: { shoppingListId: listId, ingredientId: dto.ingredientId, name: dto.name.trim(), quantity: dto.quantity, unit: dto.unit.trim(), notes: dto.notes, source: ShoppingItemSource.MANUAL },
      include: { ingredient: true, sourceRecipe: true },
    });
  }

  async updateItem(userId: string, itemId: string, dto: UpdateShoppingListItemDto) {
    const item = await this.prisma.shoppingListItem.findFirst({ where: { id: itemId, shoppingList: { userId, status: ShoppingListStatus.ACTIVE } } });
    if (!item) throw new NotFoundException('Active shopping list item not found.');
    return this.prisma.shoppingListItem.update({ where: { id: itemId }, data: dto, include: { ingredient: true, sourceRecipe: true } });
  }

  async purchaseReview(userId: string, listId: string) {
    const list = await this.findOne(userId, listId);
    const bought = list.items.filter((item) => item.status === ShoppingItemStatus.BOUGHT);
    const suggestions = await Promise.all(bought.map(async (item) => {
      const existing = item.ingredientId ? await this.prisma.pantryItem.findFirst({
        where: { userId, ingredientId: item.ingredientId, unit: { equals: item.unit, mode: 'insensitive' } },
        orderBy: { updatedAt: 'desc' },
      }) : null;
      return { ...item, suggestedStorageLocation: existing?.storageLocation ?? item.ingredient?.storageLocation ?? null, becomesPantryStock: Boolean(item.ingredientId) };
    }));
    return { listId: list.id, items: suggestions };
  }

  async complete(userId: string, listId: string, dto: CompleteShoppingListDto) {
    const list = await this.findOne(userId, listId);
    if (list.status !== ShoppingListStatus.ACTIVE) throw new BadRequestException('Shopping list is not active.');
    const boughtFood = list.items.filter((item) => item.status === ShoppingItemStatus.BOUGHT && item.ingredientId);
    const metadata = new Map((dto.purchasedItems ?? []).map((item) => [item.itemId, item]));
    const invalid = dto.purchasedItems?.find((item) => !boughtFood.some((bought) => bought.id === item.itemId));
    if (invalid) throw new BadRequestException('Purchase review contains an item that is not a bought food item.');
    const missingReview = boughtFood.find((item) => !metadata.has(item.id));
    if (missingReview) throw new BadRequestException(`Choose a storage location for ${missingReview.name}.`);

    const profile = this.measurementProfiles ? await this.measurementProfiles.active(userId) : null;
    await this.prisma.$transaction(async (tx) => {
      for (const item of boughtFood) {
        const review = metadata.get(item.id)!;
        const purchasedQuantity = review.purchasedQuantity ?? item.quantity;
        const purchasedUnit = (review.purchasedUnit ?? item.unit).trim();
        const expiryDate = review.expiryDate ? new Date(review.expiryDate) : null;
        const conversions = profile && item.ingredient
          ? this.measurementProfiles!.applyProfile(item.ingredientId!, item.ingredient.conversions, profile)
          : (item.ingredient?.conversions ?? []);
        const candidates = await tx.pantryItem.findMany({ where: { userId, ingredientId: item.ingredientId!, storageLocation: review.storageLocation, expiryDate }, orderBy: { updatedAt: 'desc' } });
        const existing = candidates.find((candidate) => convertIngredientQuantity(purchasedQuantity, purchasedUnit, candidate.unit, conversions) !== null);
        const addedQuantity = existing ? convertIngredientQuantity(purchasedQuantity, purchasedUnit, existing.unit, conversions)! : purchasedQuantity;
        const pantryItem = existing
          ? await tx.pantryItem.update({ where: { id: existing.id }, data: { quantity: { increment: addedQuantity }, lowStockThreshold: review.lowStockThreshold ?? existing.lowStockThreshold } })
          : await tx.pantryItem.create({ data: { userId, ingredientId: item.ingredientId!, quantity: purchasedQuantity, unit: purchasedUnit, storageLocation: review.storageLocation, expiryDate, lowStockThreshold: review.lowStockThreshold } });
        await tx.pantryItemLog.create({ data: { userId, pantryItemId: pantryItem.id, ingredientId: item.ingredientId, type: PantryAdjustmentType.BOUGHT, quantity: purchasedQuantity, unit: purchasedUnit, reason: `Bought via ${list.title}`, estimatedCostNaira: review.totalCostNaira } });
        await tx.shoppingListItem.update({ where: { id: item.id }, data: { quantity: purchasedQuantity, unit: purchasedUnit, storageLocation: review.storageLocation, expiryDate, lowStockThreshold: review.lowStockThreshold, totalCostNaira: review.totalCostNaira, unitCostNaira: review.totalCostNaira === undefined ? undefined : review.totalCostNaira / purchasedQuantity, purchasedAt: new Date() } });
      }
      await tx.shoppingList.update({ where: { id: listId }, data: { status: ShoppingListStatus.COMPLETED } });
    });
    return this.findOne(userId, listId);
  }

  private async refreshActiveList(userId: string, requirements: Requirement[], title: string) {
    const merged = this.mergeRequirements(requirements);
    const pantryItems = await this.prisma.pantryItem.findMany({ where: { userId, quantity: { gt: 0 } } });
    const profile = this.measurementProfiles ? await this.measurementProfiles.active(userId) : null;
    const missing = merged.map((required) => {
      const conversions = profile
        ? this.measurementProfiles!.applyProfile(required.ingredientId, required.conversions ?? [], profile)
        : required.conversions;
      const available = pantryItems
        .filter((item) => item.ingredientId === required.ingredientId)
        .reduce((sum, item) => sum + (convertIngredientQuantity(item.quantity, item.unit, required.unit, conversions) ?? 0), 0);
      return { ...required, quantity: Math.max(0, required.quantity - available) };
    }).filter((item) => item.quantity > 0);

    const active = await this.prisma.shoppingList.findMany({
      where: { userId, status: ShoppingListStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
    let list = active[0];
    if (active.length > 1) {
      await this.prisma.shoppingList.updateMany({
        where: { id: { in: active.slice(1).map((entry) => entry.id) } },
        data: { status: ShoppingListStatus.ARCHIVED },
      });
    }
    if (!list) {
      list = await this.prisma.shoppingList.create({ data: { userId, title }, include: { items: true } });
    } else if (list.title !== title) {
      await this.prisma.shoppingList.update({ where: { id: list.id }, data: { title } });
    }

    const generated = list.items.filter((item) => item.source === ShoppingItemSource.GENERATED);
    const generatedByKey = new Map(
      generated
        .filter((item) => item.ingredientId)
        .map((item) => [this.key(item.ingredientId!, item.unit), item]),
    );
    const requiredKeys = new Set(missing.map((item) => this.key(item.ingredientId, item.unit)));
    const deleteIds = generated
      .filter((item) => !item.ingredientId || !requiredKeys.has(this.key(item.ingredientId, item.unit)))
      .map((item) => item.id);
    const updates = missing.flatMap((requirement) => {
      const existing = generatedByKey.get(this.key(requirement.ingredientId, requirement.unit));
      if (!existing) return [];
      return [this.prisma.shoppingListItem.update({
        where: { id: existing.id },
        data: {
          name: requirement.name,
          quantity: requirement.quantity,
          recipeId: requirement.recipeId,
          status: requirement.quantity > existing.quantity ? ShoppingItemStatus.PENDING : existing.status,
        },
      })];
    });
    const creates = missing.filter(
      (requirement) => !generatedByKey.has(this.key(requirement.ingredientId, requirement.unit)),
    );
    const operations = [
      ...(deleteIds.length
        ? [this.prisma.shoppingListItem.deleteMany({ where: { id: { in: deleteIds } } })]
        : []),
      ...updates,
      ...(creates.length
        ? [this.prisma.shoppingListItem.createMany({
            data: creates.map((requirement) => ({
              shoppingListId: list.id,
              ingredientId: requirement.ingredientId,
              name: requirement.name,
              quantity: requirement.quantity,
              unit: requirement.unit,
              recipeId: requirement.recipeId,
              source: ShoppingItemSource.GENERATED,
            })),
          })]
        : []),
    ];
    if (operations.length) await this.prisma.$transaction(operations);

    return this.findOne(userId, list.id);
  }

  private mergeRequirements(requirements: Requirement[]) {
    const map = new Map<string, Requirement>();
    for (const requirement of requirements) {
      const key = this.key(requirement.ingredientId, requirement.unit);
      const current = map.get(key);
      if (current) current.quantity += requirement.quantity;
      else map.set(key, { ...requirement });
    }
    return [...map.values()];
  }

  private key(ingredientId: string, unit: string) { return `${ingredientId}:${unit.toLowerCase()}`; }

}
