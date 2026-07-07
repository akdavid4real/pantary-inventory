import { Injectable, NotFoundException } from '@nestjs/common';
import { MealType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { endOfDay, endOfWeek, startOfDay, startOfWeek } from '../../common/utils/date.utils';

type MacroTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

@Injectable()
export class NutritionService {
  constructor(private readonly prisma: PrismaService) {}

  async recipeNutrition(recipeId: string) {
    const recipe = await this.prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe) throw new NotFoundException('Recipe not found.');

    return {
      recipeId: recipe.id,
      recipeName: recipe.name,
      servings: recipe.servings,
      caloriesPerServing: recipe.caloriesPerServing,
      proteinPerServing: recipe.proteinPerServing,
      carbsPerServing: recipe.carbsPerServing,
      fatPerServing: recipe.fatPerServing,
      note: 'Nutrition values are estimates for school-project use.',
    };
  }

  async calculateRecipe(recipeId: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: {
          include: {
            ingredient: {
              include: { nutrition: true, conversions: true },
            },
          },
        },
      },
    });
    if (!recipe) throw new NotFoundException('Recipe not found.');

    const totals = recipe.ingredients.reduce(
      (sum, item) => {
        const nutrition = item.ingredient.nutrition;
        if (!nutrition) return sum;

        const convertedQuantity = this.convertQuantity(item.quantity, item.unit, nutrition.baseUnit, item.ingredient.conversions);
        const multiplier = nutrition.baseQuantity > 0 ? convertedQuantity / nutrition.baseQuantity : 0;

        return {
          calories: sum.calories + nutrition.calories * multiplier,
          protein: sum.protein + nutrition.protein * multiplier,
          carbs: sum.carbs + nutrition.carbs * multiplier,
          fat: sum.fat + nutrition.fat * multiplier,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    const perServing = this.divideTotals(totals, recipe.servings);

    const updated = await this.prisma.recipe.update({
      where: { id: recipeId },
      data: {
        caloriesPerServing: perServing.calories,
        proteinPerServing: perServing.protein,
        carbsPerServing: perServing.carbs,
        fatPerServing: perServing.fat,
      },
    });

    return {
      recipeId: updated.id,
      recipeName: updated.name,
      total: this.roundTotals(totals),
      perServing: this.roundTotals(perServing),
      note: 'Calculated from ingredient nutrition estimates and unit conversions where available.',
    };
  }

  async daySummary(userId: string, date: string) {
    const selectedDate = new Date(date);
    const logs = await this.prisma.nutritionLog.findMany({
      where: {
        userId,
        logDate: { gte: startOfDay(selectedDate), lte: endOfDay(selectedDate) },
      },
      include: { recipe: true },
    });

    const totals = logs.reduce((sum, log) => this.addTotals(sum, log), this.zeroTotals());

    return {
      date: selectedDate.toISOString().slice(0, 10),
      total: this.roundTotals(totals),
      logs,
    };
  }

  async weekSummary(userId: string, date?: string) {
    const selectedDate = date ? new Date(date) : new Date();
    const start = startOfWeek(selectedDate);
    const end = endOfWeek(selectedDate);

    const entries = await this.prisma.mealPlanEntry.findMany({
      where: {
        userId,
        plannedDate: { gte: start, lte: end },
        recipeId: { not: null },
      },
      include: { recipe: true },
      orderBy: { plannedDate: 'asc' },
    });

    const days = Array.from({ length: 7 }).map((_, index) => {
      const dateValue = new Date(start);
      dateValue.setDate(start.getDate() + index);
      const dayEntries = entries.filter((entry) => startOfDay(entry.plannedDate).getTime() === startOfDay(dateValue).getTime());
      const total = dayEntries.reduce((sum, entry) => {
        if (!entry.recipe) return sum;
        return this.addTotals(sum, {
          calories: entry.recipe.caloriesPerServing * entry.servings,
          protein: entry.recipe.proteinPerServing * entry.servings,
          carbs: entry.recipe.carbsPerServing * entry.servings,
          fat: entry.recipe.fatPerServing * entry.servings,
        });
      }, this.zeroTotals());

      return {
        date: dateValue.toISOString().slice(0, 10),
        day: dateValue.toLocaleDateString('en-US', { weekday: 'long' }),
        ...this.roundTotals(total),
        meals: dayEntries.length,
      };
    });

    const total = days.reduce((sum, day) => this.addTotals(sum, day), this.zeroTotals());

    return {
      weekStart: start.toISOString().slice(0, 10),
      weekEnd: end.toISOString().slice(0, 10),
      totalCalories: Math.round(total.calories),
      totalProtein: Math.round(total.protein),
      totalCarbs: Math.round(total.carbs),
      totalFat: Math.round(total.fat),
      days,
    };
  }

  async logMeal(userId: string, recipeId: string, servings: number, mealType?: MealType) {
    const recipe = await this.prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe) throw new NotFoundException('Recipe not found.');

    return this.prisma.nutritionLog.create({
      data: {
        userId,
        recipeId,
        logDate: new Date(),
        mealType,
        servings,
        calories: recipe.caloriesPerServing * servings,
        protein: recipe.proteinPerServing * servings,
        carbs: recipe.carbsPerServing * servings,
        fat: recipe.fatPerServing * servings,
        source: 'cooking-mode',
      },
    });
  }

  private convertQuantity(quantity: number, fromUnit: string, toUnit: string, conversions: Array<{ fromUnit: string; toUnit: string; multiplier: number }>) {
    if (fromUnit.toLowerCase() === toUnit.toLowerCase()) return quantity;
    const conversion = conversions.find(
      (item) => item.fromUnit.toLowerCase() === fromUnit.toLowerCase() && item.toUnit.toLowerCase() === toUnit.toLowerCase(),
    );
    return conversion ? quantity * conversion.multiplier : quantity;
  }

  private zeroTotals(): MacroTotals {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }

  private addTotals(sum: MacroTotals, value: Partial<MacroTotals>): MacroTotals {
    return {
      calories: sum.calories + (value.calories ?? 0),
      protein: sum.protein + (value.protein ?? 0),
      carbs: sum.carbs + (value.carbs ?? 0),
      fat: sum.fat + (value.fat ?? 0),
    };
  }

  private divideTotals(total: MacroTotals, divisor: number): MacroTotals {
    const safeDivisor = Math.max(1, divisor);
    return {
      calories: total.calories / safeDivisor,
      protein: total.protein / safeDivisor,
      carbs: total.carbs / safeDivisor,
      fat: total.fat / safeDivisor,
    };
  }

  private roundTotals(total: MacroTotals): MacroTotals {
    return {
      calories: Math.round(total.calories),
      protein: Math.round(total.protein),
      carbs: Math.round(total.carbs),
      fat: Math.round(total.fat),
    };
  }
}
