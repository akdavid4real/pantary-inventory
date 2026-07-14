import { BadRequestException, Injectable } from '@nestjs/common';
import { PantryAdjustmentType, ShoppingItemStatus, ShoppingListStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { endOfDay, endOfWeek, startOfDay, startOfWeek } from '../../common/utils/date.utils';
import { RecipeMatcherService } from '../recipe-matcher/recipe-matcher.service';

function localDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recipeMatcherService: RecipeMatcherService,
  ) {}

  async summary(userId: string) {
    const today = new Date();
    const [todayMeals, pantryItems, shoppingList, weeklyMeals] = await Promise.all([
      this.prisma.mealPlanEntry.findMany({
        where: { userId, plannedDate: { gte: startOfDay(today), lte: endOfDay(today) } },
        include: { recipe: true },
        orderBy: { mealType: 'asc' },
      }),
      this.prisma.pantryItem.findMany({
        where: { userId },
        include: { ingredient: { include: { aliases: true } } },
      }),
      this.prisma.shoppingList.findFirst({
        where: { userId, status: ShoppingListStatus.ACTIVE },
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      this.prisma.mealPlanEntry.findMany({
        where: {
          userId,
          plannedDate: { gte: startOfWeek(today), lte: endOfWeek(today) },
          recipeId: { not: null },
        },
        include: { recipe: true },
      }),
    ]);

    const recommendations = await this.recipeMatcherService.fromPantryItems(pantryItems);
    const expiryCutoff = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiringItems = pantryItems
      .filter((item) => item.expiryDate && item.expiryDate >= today && item.expiryDate <= expiryCutoff)
      .sort((a, b) => a.expiryDate!.getTime() - b.expiryDate!.getTime())
      .slice(0, 5);

    const lowStockItems = pantryItems.filter((item) => item.lowStockThreshold !== null && item.quantity <= item.lowStockThreshold);
    const pendingShoppingItems = shoppingList?.items.filter((item) => item.status === ShoppingItemStatus.PENDING) ?? [];

    const weeklyNutrition = weeklyMeals.reduce(
      (sum, entry) => {
        if (!entry.recipe) return sum;
        return {
          calories: sum.calories + entry.recipe.caloriesPerServing * entry.servings,
          protein: sum.protein + entry.recipe.proteinPerServing * entry.servings,
          carbs: sum.carbs + entry.recipe.carbsPerServing * entry.servings,
          fat: sum.fat + entry.recipe.fatPerServing * entry.servings,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    return {
      todayMeals,
      weekMeals: weeklyMeals,
      counts: {
        todayMeals: todayMeals.length,
        pantryItems: pantryItems.length,
        expiringItems: expiringItems.length,
        lowStockItems: lowStockItems.length,
        pendingShoppingItems: pendingShoppingItems.length,
      },
      expiringItems,
      lowStockItems: lowStockItems.slice(0, 5),
      shoppingSummary: {
        listId: shoppingList?.id ?? null,
        title: shoppingList?.title ?? null,
        pendingItems: pendingShoppingItems.length,
        totalItems: shoppingList?.items.length ?? 0,
        boughtItems: shoppingList?.items.filter((item) => item.status === ShoppingItemStatus.BOUGHT).length ?? 0,
        skippedItems: shoppingList?.items.filter((item) => item.status === ShoppingItemStatus.SKIPPED).length ?? 0,
      },
      weeklyNutrition: {
        calories: Math.round(weeklyNutrition.calories),
        protein: Math.round(weeklyNutrition.protein),
        carbs: Math.round(weeklyNutrition.carbs),
        fat: Math.round(weeklyNutrition.fat),
      },
      recommendedRecipes: recommendations.slice(0, 5),
    };
  }

  async analytics(userId: string, startDate: string, endDate: string) {
    const start = startOfDay(new Date(`${startDate}T12:00:00`));
    const end = endOfDay(new Date(`${endDate}T12:00:00`));
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      throw new BadRequestException('Choose a valid analytics date range.');
    }
    const dayCount = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
    if (dayCount > 366) throw new BadRequestException('Analytics ranges are limited to 366 days.');

    const [nutritionLogs, purchases, wasteLogs] = await Promise.all([
      this.prisma.nutritionLog.findMany({
        where: { userId, logDate: { gte: start, lte: end } },
        select: { logDate: true, calories: true, protein: true, carbs: true, fat: true },
      }),
      this.prisma.shoppingListItem.findMany({
        where: { shoppingList: { userId }, purchasedAt: { gte: start, lte: end }, status: ShoppingItemStatus.BOUGHT },
        select: { purchasedAt: true, totalCostNaira: true },
      }),
      this.prisma.pantryItemLog.findMany({
        where: { userId, createdAt: { gte: start, lte: end }, type: { in: [PantryAdjustmentType.EXPIRED, PantryAdjustmentType.REMOVED] } },
        select: { createdAt: true, estimatedCostNaira: true },
      }),
    ]);

    const days = Array.from({ length: dayCount }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return { date: localDateKey(date), calories: 0, protein: 0, carbs: 0, fat: 0, spendingNaira: 0, wasteNaira: 0, wasteEvents: 0 };
    });
    const byDate = new Map(days.map((day) => [day.date, day]));
    for (const log of nutritionLogs) {
      const day = byDate.get(localDateKey(log.logDate));
      if (day) { day.calories += log.calories; day.protein += log.protein; day.carbs += log.carbs; day.fat += log.fat; }
    }
    for (const purchase of purchases) {
      const day = purchase.purchasedAt ? byDate.get(localDateKey(purchase.purchasedAt)) : null;
      if (day) day.spendingNaira += purchase.totalCostNaira ?? 0;
    }
    for (const waste of wasteLogs) {
      const day = byDate.get(localDateKey(waste.createdAt));
      if (day) { day.wasteEvents += 1; day.wasteNaira += waste.estimatedCostNaira ?? 0; }
    }
    const rounded = days.map((day) => ({ ...day, calories: Math.round(day.calories), protein: Math.round(day.protein), carbs: Math.round(day.carbs), fat: Math.round(day.fat), spendingNaira: Math.round(day.spendingNaira * 100) / 100, wasteNaira: Math.round(day.wasteNaira * 100) / 100 }));
    return {
      startDate,
      endDate,
      totals: rounded.reduce((sum, day) => ({ calories: sum.calories + day.calories, protein: sum.protein + day.protein, carbs: sum.carbs + day.carbs, fat: sum.fat + day.fat, spendingNaira: sum.spendingNaira + day.spendingNaira, wasteNaira: sum.wasteNaira + day.wasteNaira, wasteEvents: sum.wasteEvents + day.wasteEvents }), { calories: 0, protein: 0, carbs: 0, fat: 0, spendingNaira: 0, wasteNaira: 0, wasteEvents: 0 }),
      days: rounded,
    };
  }
}
