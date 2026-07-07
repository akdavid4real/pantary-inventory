import { PrismaClient, IngredientCategory, RecipeCategory, StorageLocation } from '@prisma/client';
import { slugify } from '../src/common/utils/string.utils';

const prisma = new PrismaClient();

type NutritionSeed = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

async function upsertIngredient(
  name: string,
  category: IngredientCategory,
  defaultUnit: string,
  nutrition: NutritionSeed,
  aliases: string[] = [],
) {
  const ingredient = await prisma.ingredient.upsert({
    where: { slug: slugify(name) },
    update: {},
    create: {
      name,
      slug: slugify(name),
      category,
      defaultUnit,
      storageLocation: StorageLocation.PANTRY,
      aliases: {
        create: [name, ...aliases].map((alias) => ({ alias, normalized: alias.toLowerCase().trim() })),
      },
    },
  });

  await prisma.ingredientNutrition.upsert({
    where: { ingredientId: ingredient.id },
    update: nutrition,
    create: {
      ingredientId: ingredient.id,
      baseQuantity: 100,
      baseUnit: defaultUnit,
      ...nutrition,
      source: 'school-project-estimate',
    },
  });

  return ingredient;
}

async function main() {
  const ingredients = {
    rice: await upsertIngredient('rice', IngredientCategory.GRAINS, 'g', { calories: 365, protein: 7, carbs: 80, fat: 1 }),
    beans: await upsertIngredient('beans', IngredientCategory.LEGUMES, 'g', { calories: 347, protein: 21, carbs: 63, fat: 1 }),
    yam: await upsertIngredient('yam', IngredientCategory.TUBERS, 'g', { calories: 118, protein: 2, carbs: 28, fat: 0 }),
    plantain: await upsertIngredient('plantain', IngredientCategory.FRUITS, 'g', { calories: 122, protein: 1, carbs: 32, fat: 0 }),
    tomato: await upsertIngredient('tomato', IngredientCategory.VEGETABLES, 'g', { calories: 18, protein: 1, carbs: 4, fat: 0 }, ['tomatoes']),
    pepper: await upsertIngredient('pepper', IngredientCategory.SPICES, 'g', { calories: 40, protein: 2, carbs: 9, fat: 0 }, ['ata rodo', 'scotch bonnet']),
    onion: await upsertIngredient('onion', IngredientCategory.VEGETABLES, 'g', { calories: 40, protein: 1, carbs: 9, fat: 0 }),
    vegetableOil: await upsertIngredient('vegetable oil', IngredientCategory.OIL, 'ml', { calories: 884, protein: 0, carbs: 0, fat: 100 }),
    palmOil: await upsertIngredient('palm oil', IngredientCategory.OIL, 'ml', { calories: 884, protein: 0, carbs: 0, fat: 100 }),
    chicken: await upsertIngredient('chicken', IngredientCategory.PROTEIN, 'g', { calories: 239, protein: 27, carbs: 0, fat: 14 }),
    egg: await upsertIngredient('egg', IngredientCategory.PROTEIN, 'piece', { calories: 155, protein: 13, carbs: 1, fat: 11 }),
    egusi: await upsertIngredient('egusi', IngredientCategory.SPICES, 'g', { calories: 559, protein: 28, carbs: 11, fat: 47 }, ['melon seed']),
    garri: await upsertIngredient('garri', IngredientCategory.SWALLOW, 'g', { calories: 360, protein: 1, carbs: 88, fat: 0 }, ['gari', 'cassava flakes']),
    crayfish: await upsertIngredient('dried crayfish', IngredientCategory.SEAFOOD, 'g', { calories: 330, protein: 60, carbs: 0, fat: 5 }, ['crayfish']),
    spinach: await upsertIngredient('spinach', IngredientCategory.VEGETABLES, 'g', { calories: 23, protein: 3, carbs: 4, fat: 0 }, ['ugu', 'fluted pumpkin leaf']),
  };

  await prisma.recipe.upsert({
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
          { ingredientId: ingredients.rice.id, quantity: 500, unit: 'g' },
          { ingredientId: ingredients.tomato.id, quantity: 300, unit: 'g' },
          { ingredientId: ingredients.pepper.id, quantity: 80, unit: 'g' },
          { ingredientId: ingredients.onion.id, quantity: 100, unit: 'g' },
          { ingredientId: ingredients.vegetableOil.id, quantity: 80, unit: 'ml' },
          { ingredientId: ingredients.chicken.id, quantity: 600, unit: 'g' },
        ],
      },
      steps: {
        create: [
          { stepNumber: 1, instruction: 'Blend tomato, pepper, and onion into a smooth sauce.' },
          { stepNumber: 2, instruction: 'Fry the sauce in oil until reduced.' },
          { stepNumber: 3, instruction: 'Add washed rice, stock, and seasoning.' },
          { stepNumber: 4, instruction: 'Cook on low heat until the rice is soft.' },
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

  await prisma.recipe.upsert({
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
          { ingredientId: ingredients.beans.id, quantity: 450, unit: 'g' },
          { ingredientId: ingredients.plantain.id, quantity: 600, unit: 'g' },
          { ingredientId: ingredients.onion.id, quantity: 80, unit: 'g' },
          { ingredientId: ingredients.palmOil.id, quantity: 40, unit: 'ml' },
        ],
      },
      steps: {
        create: [
          { stepNumber: 1, instruction: 'Boil beans until soft.' },
          { stepNumber: 2, instruction: 'Add onion, oil, and seasoning, then simmer.' },
          { stepNumber: 3, instruction: 'Cook or fry plantain and serve with the beans.' },
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

  await prisma.recipe.upsert({
    where: { slug: 'yam-porridge' },
    update: {},
    create: {
      name: 'Yam Porridge',
      slug: 'yam-porridge',
      description: 'Yam cooked in pepper sauce with palm oil.',
      category: RecipeCategory.LUNCH,
      region: 'Nigeria',
      servings: 4,
      prepTimeMinutes: 15,
      cookTimeMinutes: 35,
      caloriesPerServing: 480,
      proteinPerServing: 12,
      carbsPerServing: 74,
      fatPerServing: 14,
      ingredients: {
        create: [
          { ingredientId: ingredients.yam.id, quantity: 800, unit: 'g' },
          { ingredientId: ingredients.tomato.id, quantity: 250, unit: 'g' },
          { ingredientId: ingredients.pepper.id, quantity: 60, unit: 'g' },
          { ingredientId: ingredients.onion.id, quantity: 100, unit: 'g' },
          { ingredientId: ingredients.palmOil.id, quantity: 70, unit: 'ml' },
        ],
      },
      steps: {
        create: [
          { stepNumber: 1, instruction: 'Peel and cut yam into cubes.' },
          { stepNumber: 2, instruction: 'Cook yam with pepper mixture and seasoning.' },
          { stepNumber: 3, instruction: 'Mash slightly and simmer until thick.' },
        ],
      },
    },
  });

  await prisma.recipe.upsert({
    where: { slug: 'egusi-soup-and-garri' },
    update: {},
    create: {
      name: 'Egusi Soup and Garri',
      slug: 'egusi-soup-and-garri',
      description: 'Egusi soup served with garri swallow.',
      category: RecipeCategory.SOUP,
      region: 'Nigeria',
      servings: 4,
      prepTimeMinutes: 25,
      cookTimeMinutes: 50,
      caloriesPerServing: 700,
      proteinPerServing: 25,
      carbsPerServing: 65,
      fatPerServing: 36,
      ingredients: {
        create: [
          { ingredientId: ingredients.egusi.id, quantity: 250, unit: 'g' },
          { ingredientId: ingredients.palmOil.id, quantity: 100, unit: 'ml' },
          { ingredientId: ingredients.crayfish.id, quantity: 40, unit: 'g' },
          { ingredientId: ingredients.spinach.id, quantity: 200, unit: 'g' },
          { ingredientId: ingredients.garri.id, quantity: 500, unit: 'g' },
        ],
      },
      steps: {
        create: [
          { stepNumber: 1, instruction: 'Fry egusi mixture in palm oil.' },
          { stepNumber: 2, instruction: 'Add stock, crayfish, and seasoning.' },
          { stepNumber: 3, instruction: 'Add vegetables and simmer.' },
          { stepNumber: 4, instruction: 'Prepare garri swallow and serve with the soup.' },
        ],
      },
    },
  });

  await prisma.recipe.upsert({
    where: { slug: 'akara' },
    update: {},
    create: {
      name: 'Akara',
      slug: 'akara',
      description: 'Fried bean cakes made from blended beans and pepper.',
      category: RecipeCategory.BREAKFAST,
      region: 'Nigeria',
      servings: 3,
      prepTimeMinutes: 40,
      cookTimeMinutes: 20,
      caloriesPerServing: 420,
      proteinPerServing: 18,
      carbsPerServing: 48,
      fatPerServing: 16,
      ingredients: {
        create: [
          { ingredientId: ingredients.beans.id, quantity: 350, unit: 'g' },
          { ingredientId: ingredients.pepper.id, quantity: 40, unit: 'g' },
          { ingredientId: ingredients.onion.id, quantity: 70, unit: 'g' },
          { ingredientId: ingredients.vegetableOil.id, quantity: 120, unit: 'ml' },
        ],
      },
      steps: {
        create: [
          { stepNumber: 1, instruction: 'Soak and peel beans.' },
          { stepNumber: 2, instruction: 'Blend beans with pepper and onion.' },
          { stepNumber: 3, instruction: 'Whisk batter and fry spoonfuls in hot oil.' },
        ],
      },
    },
  });

  console.log('PlateSense seed completed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
