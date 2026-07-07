import { Injectable } from '@nestjs/common';
import { IngredientCategory, RecipeCategory, StorageLocation } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { slugify } from '../../common/utils/string.utils';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const [ingredients, recipes, users, pantryItems, mealPlanEntries, shoppingLists] = await Promise.all([
      this.prisma.ingredient.count(),
      this.prisma.recipe.count(),
      this.prisma.user.count(),
      this.prisma.pantryItem.count(),
      this.prisma.mealPlanEntry.count(),
      this.prisma.shoppingList.count(),
    ]);

    return { ingredients, recipes, users, pantryItems, mealPlanEntries, shoppingLists };
  }

  async seedDemoData() {
    const rice = await this.upsertIngredient('rice', IngredientCategory.GRAINS, 'g', { calories: 365, protein: 7, carbs: 80, fat: 1 });
    const tomato = await this.upsertIngredient('tomato', IngredientCategory.VEGETABLES, 'g', { calories: 18, protein: 1, carbs: 4, fat: 0 });
    const pepper = await this.upsertIngredient('pepper', IngredientCategory.SPICES, 'g', { calories: 40, protein: 2, carbs: 9, fat: 0 });
    const onion = await this.upsertIngredient('onion', IngredientCategory.VEGETABLES, 'g', { calories: 40, protein: 1, carbs: 9, fat: 0 });
    const oil = await this.upsertIngredient('vegetable oil', IngredientCategory.OIL, 'ml', { calories: 884, protein: 0, carbs: 0, fat: 100 });
    const chicken = await this.upsertIngredient('chicken', IngredientCategory.PROTEIN, 'g', { calories: 239, protein: 27, carbs: 0, fat: 14 });
    const beans = await this.upsertIngredient('beans', IngredientCategory.LEGUMES, 'g', { calories: 347, protein: 21, carbs: 63, fat: 1 });
    const plantain = await this.upsertIngredient('plantain', IngredientCategory.FRUITS, 'g', { calories: 122, protein: 1, carbs: 32, fat: 0 });

    await this.prisma.recipe.upsert({
      where: { slug: 'jollof-rice' },
      update: {},
      create: {
        name: 'Jollof Rice',
        slug: 'jollof-rice',
        description: 'A Nigerian rice dish cooked in tomato and pepper sauce.',
        category: RecipeCategory.RICE_MEAL,
        region: 'Nigeria',
        servings: 4,
        prepTimeMinutes: 20,
        cookTimeMinutes: 45,
        caloriesPerServing: 620,
        proteinPerServing: 28,
        carbsPerServing: 82,
        fatPerServing: 18,
        ingredients: {
          create: [
            { ingredientId: rice.id, quantity: 500, unit: 'g' },
            { ingredientId: tomato.id, quantity: 300, unit: 'g' },
            { ingredientId: pepper.id, quantity: 80, unit: 'g' },
            { ingredientId: onion.id, quantity: 100, unit: 'g' },
            { ingredientId: oil.id, quantity: 80, unit: 'ml' },
            { ingredientId: chicken.id, quantity: 600, unit: 'g' },
          ],
        },
        steps: {
          create: [
            { stepNumber: 1, instruction: 'Blend tomato, pepper, and onion into a smooth sauce.' },
            { stepNumber: 2, instruction: 'Fry the sauce in oil until reduced and fragrant.' },
            { stepNumber: 3, instruction: 'Add washed rice, stock, and seasoning, then cook until soft.' },
            { stepNumber: 4, instruction: 'Serve hot with chicken or preferred protein.' },
          ],
        },
        tags: {
          create: [
            { tag: { connectOrCreate: { where: { slug: 'nigerian' }, create: { name: 'Nigerian', slug: 'nigerian' } } } },
            { tag: { connectOrCreate: { where: { slug: 'family-meal' }, create: { name: 'Family Meal', slug: 'family-meal' } } } },
          ],
        },
      },
    });

    await this.prisma.recipe.upsert({
      where: { slug: 'beans-and-plantain' },
      update: {},
      create: {
        name: 'Beans and Plantain',
        slug: 'beans-and-plantain',
        description: 'Soft cooked beans served with ripe plantain.',
        category: RecipeCategory.BEANS_MEAL,
        region: 'Nigeria',
        servings: 3,
        prepTimeMinutes: 15,
        cookTimeMinutes: 60,
        caloriesPerServing: 540,
        proteinPerServing: 22,
        carbsPerServing: 90,
        fatPerServing: 8,
        ingredients: {
          create: [
            { ingredientId: beans.id, quantity: 450, unit: 'g' },
            { ingredientId: plantain.id, quantity: 600, unit: 'g' },
            { ingredientId: onion.id, quantity: 80, unit: 'g' },
            { ingredientId: oil.id, quantity: 40, unit: 'ml' },
          ],
        },
        steps: {
          create: [
            { stepNumber: 1, instruction: 'Boil beans until soft.' },
            { stepNumber: 2, instruction: 'Add onion, oil, and seasoning, then simmer.' },
            { stepNumber: 3, instruction: 'Fry or boil plantain and serve with the beans.' },
          ],
        },
        tags: {
          create: [
            { tag: { connectOrCreate: { where: { slug: 'student-friendly' }, create: { name: 'Student Friendly', slug: 'student-friendly' } } } },
            { tag: { connectOrCreate: { where: { slug: 'high-protein' }, create: { name: 'High Protein', slug: 'high-protein' } } } },
          ],
        },
      },
    });

    return this.stats();
  }

  private async upsertIngredient(
    name: string,
    category: IngredientCategory,
    defaultUnit: string,
    nutrition: { calories: number; protein: number; carbs: number; fat: number },
  ) {
    const ingredient = await this.prisma.ingredient.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: {
        name,
        slug: slugify(name),
        category,
        defaultUnit,
        storageLocation: StorageLocation.PANTRY,
        aliases: { create: [{ alias: name, normalized: name }] },
      },
    });

    await this.prisma.ingredientNutrition.upsert({
      where: { ingredientId: ingredient.id },
      update: nutrition,
      create: {
        ingredientId: ingredient.id,
        baseQuantity: defaultUnit === 'ml' ? 100 : 100,
        baseUnit: defaultUnit,
        ...nutrition,
        source: 'demo-estimate',
      },
    });

    return ingredient;
  }
}
