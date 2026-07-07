import { Injectable } from '@nestjs/common';
import { ShoppingItemStatus, ShoppingListStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { endOfDay, endOfWeek, startOfDay, startOfWeek } from '../../common/utils/date.utils';
import { RecipeMatcherService } from '../recipe-matcher/recipe-matcher.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recipeMatcherService: RecipeMatcherService,
  ) {}

  async summary(userId: string) {
    const today = new Date();
    const [todayMeals, expiringItems, pantryItems, shoppingList, weeklyMeals, recommendations] = await Promise.all([
      this.prisma.mealPlanEntry.findMany({
        where: { userId, plannedDate: { gte: startOfDay(today), lte: endOfDay(today) } },
        include: { recipe: true },
        orderBy: { mealType: 'asc' },
      }),
      this.prisma.pantryItem.findMany({
        where: { userId, expiryDate: { gte: today, lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) } },
        include: { ingredient: true },
        orderBy: { expiryDate: 'asc' },
        take: 5,
      }),
      this.prisma.pantryItem.findMany({ where: { userId }, include: { ingredient: true } }),
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
      this.recipeMatcherService.fromPantry(userId),
    ]);

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
}
