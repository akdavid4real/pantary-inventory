import 'dotenv/config';
import {
  MealType,
  PantryAdjustmentType,
  PrismaClient,
  RecipeModerationStatus,
  RecipeStatus,
  ShoppingItemSource,
  ShoppingItemStatus,
  ShoppingListStatus,
  StorageLocation,
} from '@prisma/client';

const prisma = new PrismaClient();
const DEMO_MARKER = 'Pantry-to-Plate account seed';

function dateAtNoon(daysFromToday: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + daysFromToday);
  return date;
}

function startOfWeek() {
  const monday = dateAtNoon(0);
  const day = monday.getDay() || 7;
  monday.setDate(monday.getDate() - day + 1);
  return monday;
}

function weekDate(dayOffset: number) {
  const date = startOfWeek();
  date.setDate(date.getDate() + dayOffset);
  return date;
}

function targetEmail() {
  const argument = process.argv.find((value) => value.startsWith('--email='));
  const email = argument?.slice('--email='.length).trim().toLowerCase();
  if (!email) throw new Error('Pass the target account as --email=user@example.com.');
  return email;
}

async function main() {
  const email = targetEmail();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`No application user exists for ${email}. Sign in once before seeding.`);

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: { displayName: 'David' },
    create: { userId: user.id, displayName: 'David' },
  });

  await prisma.userPreference.upsert({
    where: { userId: user.id },
    update: {
      dietaryPreference: 'Balanced',
      allergies: [],
      avoidedIngredients: [],
      calorieGoal: 2200,
      proteinGoal: 130,
      carbsGoal: 300,
      fatGoal: 70,
      maxCookingMinutes: 60,
      preferNigerianMeals: true,
      cookingComfort: 'Intermediate',
      defaultServings: 4,
    },
    create: {
      userId: user.id,
      dietaryPreference: 'Balanced',
      calorieGoal: 2200,
      proteinGoal: 130,
      carbsGoal: 300,
      fatGoal: 70,
      maxCookingMinutes: 60,
      preferNigerianMeals: true,
      cookingComfort: 'Intermediate',
      defaultServings: 4,
    },
  });

  await prisma.measurementProfile.upsert({
    where: { userId_name: { userId: user.id, name: 'My Nigerian kitchen' } },
    update: { isDefault: true, cupMl: 250, tablespoonMl: 15, teaspoonMl: 5, dericaMl: 1000 },
    create: {
      userId: user.id,
      name: 'My Nigerian kitchen',
      isDefault: true,
      cupMl: 250,
      tablespoonMl: 15,
      teaspoonMl: 5,
      dericaMl: 1000,
    },
  });

  const pantrySeed = [
    ['rice', 3000, 'g', 700, 90, StorageLocation.PANTRY],
    ['beans', 1800, 'g', 500, 90, StorageLocation.PANTRY],
    ['garri', 1500, 'g', 400, 120, StorageLocation.PANTRY],
    ['palm-oil', 1200, 'ml', 300, 180, StorageLocation.PANTRY],
    ['vegetable-oil', 700, 'ml', 250, 150, StorageLocation.PANTRY],
    ['yam', 2500, 'g', 800, 12, StorageLocation.PANTRY],
    ['plantain', 700, 'g', 600, 5, StorageLocation.COUNTER],
    ['tomato', 500, 'g', 600, 4, StorageLocation.FRIDGE],
    ['onion', 800, 'g', 250, 28, StorageLocation.PANTRY],
    ['pepper', 180, 'g', 60, 6, StorageLocation.FRIDGE],
    ['egg', 12, 'piece', 6, 14, StorageLocation.FRIDGE],
    ['chicken', 1500, 'g', 500, 45, StorageLocation.FREEZER],
    ['egusi', 600, 'g', 200, 90, StorageLocation.PANTRY],
    ['dried-crayfish', 250, 'g', 80, 120, StorageLocation.PANTRY],
    ['spinach', 250, 'g', 300, 3, StorageLocation.FRIDGE],
    ['stockfish', 450, 'g', 150, 150, StorageLocation.PANTRY],
  ] as const;

  const ingredientSlugs = pantrySeed.map(([slug]) => slug);
  const ingredients = await prisma.ingredient.findMany({ where: { slug: { in: ingredientSlugs } } });
  const ingredientBySlug = new Map(ingredients.map((ingredient) => [ingredient.slug, ingredient]));
  const missingIngredients = ingredientSlugs.filter((slug) => !ingredientBySlug.has(slug));
  if (missingIngredients.length) throw new Error(`Missing ingredients: ${missingIngredients.join(', ')}`);

  for (const [slug, quantity, unit, lowStockThreshold, expiryDays, storageLocation] of pantrySeed) {
    const ingredient = ingredientBySlug.get(slug)!;
    const existing = await prisma.pantryItem.findFirst({
      where: { userId: user.id, ingredientId: ingredient.id },
      orderBy: { createdAt: 'asc' },
    });
    const data = {
      quantity,
      unit,
      lowStockThreshold,
      expiryDate: dateAtNoon(expiryDays),
      storageLocation,
      notes: DEMO_MARKER,
    };
    if (existing) await prisma.pantryItem.update({ where: { id: existing.id }, data });
    else await prisma.pantryItem.create({ data: { userId: user.id, ingredientId: ingredient.id, ...data } });
  }

  const recipeSlugs = ['akara', 'beans-and-plantain', 'egusi-soup-and-garri', 'jollof-rice', 'yam-porridge'];
  const recipes = await prisma.recipe.findMany({
    where: { slug: { in: recipeSlugs } },
    include: { ingredients: true, steps: true },
  });
  const recipeBySlug = new Map(recipes.map((recipe) => [recipe.slug, recipe]));
  const missingRecipes = recipeSlugs.filter((slug) => !recipeBySlug.has(slug));
  if (missingRecipes.length) throw new Error(`Missing recipes: ${missingRecipes.join(', ')}`);

  const personalRecipeSeed = [
    {
      slug: 'davids-sunday-jollof',
      name: "David's Sunday Jollof",
      description: 'A rich party-style jollof with grilled chicken for an easy Sunday family meal.',
      baseSlug: 'jollof-rice',
    },
    {
      slug: 'davids-weeknight-yam-porridge',
      name: "David's Weeknight Yam Porridge",
      description: 'A one-pot yam porridge built for a filling Nigerian weeknight dinner.',
      baseSlug: 'yam-porridge',
    },
    {
      slug: 'davids-egusi-soup-pot',
      name: "David's Egusi Soup Pot",
      description: 'A homestyle egusi soup pot with leafy vegetables, crayfish, and garri on the side.',
      baseSlug: 'egusi-soup-and-garri',
    },
  ] as const;
  for (const seededRecipe of personalRecipeSeed) {
    const base = recipeBySlug.get(seededRecipe.baseSlug)!;
    const details = {
      createdByUserId: user.id,
      name: seededRecipe.name,
      description: seededRecipe.description,
      category: base.category,
      region: 'Nigeria',
      imageUrl: base.imageUrl,
      servings: base.servings,
      prepTimeMinutes: base.prepTimeMinutes,
      cookTimeMinutes: base.cookTimeMinutes,
      difficulty: base.difficulty ?? 'Intermediate',
      caloriesPerServing: base.caloriesPerServing,
      proteinPerServing: base.proteinPerServing,
      carbsPerServing: base.carbsPerServing,
      fatPerServing: base.fatPerServing,
      isPublished: true,
      status: RecipeStatus.PUBLISHED,
      moderationStatus: RecipeModerationStatus.APPROVED,
      moderationNote: null,
      moderatedAt: new Date(),
    };
    await prisma.recipe.upsert({
      where: { slug: seededRecipe.slug },
      update: {
        ...details,
        ingredients: {
          deleteMany: {},
          create: base.ingredients.map(({ ingredientId, quantity, unit, isOptional, notes }) => ({
            ingredientId,
            quantity,
            unit,
            isOptional,
            notes,
          })),
        },
        steps: {
          deleteMany: {},
          create: base.steps.map(({ stepNumber, instruction, durationMinutes }) => ({
            stepNumber,
            instruction,
            durationMinutes,
          })),
        },
      },
      create: {
        slug: seededRecipe.slug,
        ...details,
        ingredients: {
          create: base.ingredients.map(({ ingredientId, quantity, unit, isOptional, notes }) => ({
            ingredientId,
            quantity,
            unit,
            isOptional,
            notes,
          })),
        },
        steps: {
          create: base.steps.map(({ stepNumber, instruction, durationMinutes }) => ({
            stepNumber,
            instruction,
            durationMinutes,
          })),
        },
      },
    });
  }

  await prisma.mealPlanEntry.deleteMany({ where: { userId: user.id, notes: DEMO_MARKER } });
  const mealPlan = [
    [0, 'akara', MealType.BREAKFAST, 2],
    [0, 'jollof-rice', MealType.DINNER, 2],
    [1, 'beans-and-plantain', MealType.LUNCH, 2],
    [2, 'egusi-soup-and-garri', MealType.DINNER, 2],
    [3, 'yam-porridge', MealType.LUNCH, 2],
    [4, 'jollof-rice', MealType.DINNER, 3],
    [5, 'akara', MealType.BREAKFAST, 3],
    [6, 'egusi-soup-and-garri', MealType.DINNER, 3],
  ] as const;
  await prisma.mealPlanEntry.createMany({
    data: mealPlan.map(([day, slug, mealType, servings]) => ({
      userId: user.id,
      recipeId: recipeBySlug.get(slug)!.id,
      plannedDate: weekDate(day),
      mealType,
      servings,
      notes: DEMO_MARKER,
    })),
  });

  for (const slug of recipeSlugs) {
    await prisma.recipeFavorite.upsert({
      where: { userId_recipeId: { userId: user.id, recipeId: recipeBySlug.get(slug)!.id } },
      update: {},
      create: { userId: user.id, recipeId: recipeBySlug.get(slug)!.id },
    });
  }

  const activeList = await prisma.shoppingList.findFirst({
    where: { userId: user.id, status: ShoppingListStatus.ACTIVE },
    orderBy: { createdAt: 'desc' },
  });
  const shoppingList = activeList
    ? await prisma.shoppingList.update({
        where: { id: activeList.id },
        data: { title: "David's Nigerian market list" },
      })
    : await prisma.shoppingList.create({
        data: { userId: user.id, title: "David's Nigerian market list", status: ShoppingListStatus.ACTIVE },
      });

  await prisma.shoppingListItem.deleteMany({
    where: { shoppingListId: shoppingList.id, notes: DEMO_MARKER },
  });
  const shoppingSeed = [
    ['Eggs', 'egg', 12, 'piece', ShoppingItemStatus.BOUGHT, 400, 4800, -1],
    ['Red palm oil', 'palm-oil', 2, 'litre', ShoppingItemStatus.BOUGHT, 2500, 5000, -2],
    ['Fresh plum tomatoes', 'tomato', 1500, 'g', ShoppingItemStatus.PENDING, 4, 6000, null],
    ['Chicken', 'chicken', 2000, 'g', ShoppingItemStatus.PENDING, 6, 12000, null],
    ['Ugu / pumpkin leaves', 'spinach', 600, 'g', ShoppingItemStatus.PENDING, 5, 3000, null],
    ['Plantain', 'plantain', 1600, 'g', ShoppingItemStatus.PENDING, 3.5, 5600, null],
    ['Stockfish', 'stockfish', 500, 'g', ShoppingItemStatus.PENDING, 14, 7000, null],
  ] as const;
  for (const [name, slug, quantity, unit, status, unitCostNaira, totalCostNaira, purchasedDaysAgo] of shoppingSeed) {
    await prisma.shoppingListItem.create({
      data: {
        shoppingListId: shoppingList.id,
        ingredientId: ingredientBySlug.get(slug)!.id,
        name,
        quantity,
        unit,
        status,
        source: ShoppingItemSource.MANUAL,
        notes: DEMO_MARKER,
        unitCostNaira,
        totalCostNaira,
        purchasedAt: purchasedDaysAgo === null ? null : dateAtNoon(purchasedDaysAgo),
      },
    });
  }

  const historyTitle = "David's Nigerian market history";
  const existingHistory = await prisma.shoppingList.findFirst({
    where: { userId: user.id, title: historyTitle },
  });
  const historyList = existingHistory
    ? await prisma.shoppingList.update({
        where: { id: existingHistory.id },
        data: { status: ShoppingListStatus.COMPLETED },
      })
    : await prisma.shoppingList.create({
        data: { userId: user.id, title: historyTitle, status: ShoppingListStatus.COMPLETED },
      });
  await prisma.shoppingListItem.deleteMany({
    where: { shoppingListId: historyList.id, notes: DEMO_MARKER },
  });
  const purchaseHistory = [
    ['Long-grain rice', 'rice', 5000, 'g', 12000, -27],
    ['Brown beans', 'beans', 2500, 'g', 7500, -22],
    ['Chicken', 'chicken', 2000, 'g', 12000, -16],
    ['Fresh plum tomatoes', 'tomato', 2000, 'g', 8000, -11],
    ['Red palm oil', 'palm-oil', 2, 'litre', 5000, -6],
    ['Eggs', 'egg', 12, 'piece', 4800, -3],
  ] as const;
  await prisma.shoppingListItem.createMany({
    data: purchaseHistory.map(([name, slug, quantity, unit, totalCostNaira, purchasedDaysAgo]) => ({
      shoppingListId: historyList.id,
      ingredientId: ingredientBySlug.get(slug)!.id,
      name,
      quantity,
      unit,
      status: ShoppingItemStatus.BOUGHT,
      source: ShoppingItemSource.MANUAL,
      notes: DEMO_MARKER,
      totalCostNaira,
      purchasedAt: dateAtNoon(purchasedDaysAgo),
    })),
  });

  await prisma.nutritionLog.deleteMany({ where: { userId: user.id, source: DEMO_MARKER } });
  const nutritionRecipes = recipeSlugs.map((slug) => recipeBySlug.get(slug)!);
  await prisma.nutritionLog.createMany({
    data: Array.from({ length: 14 }, (_, index) => {
      const recipe = nutritionRecipes[index % nutritionRecipes.length];
      return {
        userId: user.id,
        recipeId: recipe.id,
        logDate: dateAtNoon(index - 13),
        mealType: index % 3 === 0 ? MealType.BREAKFAST : index % 3 === 1 ? MealType.LUNCH : MealType.DINNER,
        servings: 1,
        calories: recipe.caloriesPerServing,
        protein: recipe.proteinPerServing,
        carbs: recipe.carbsPerServing,
        fat: recipe.fatPerServing,
        source: DEMO_MARKER,
      };
    }),
  });

  await prisma.pantryItemLog.deleteMany({ where: { userId: user.id, reason: { startsWith: DEMO_MARKER } } });
  const wasteSeed = [
    ['tomato', PantryAdjustmentType.EXPIRED, 250, 'g', 1200, -11],
    ['spinach', PantryAdjustmentType.EXPIRED, 180, 'g', 900, -7],
    ['plantain', PantryAdjustmentType.REMOVED, 300, 'g', 1100, -3],
  ] as const;
  for (const [slug, type, quantity, unit, estimatedCostNaira, day] of wasteSeed) {
    await prisma.pantryItemLog.create({
      data: {
        userId: user.id,
        ingredientId: ingredientBySlug.get(slug)!.id,
        type,
        quantity,
        unit,
        reason: `${DEMO_MARKER}: realistic waste history`,
        estimatedCostNaira,
        createdAt: dateAtNoon(day),
      },
    });
  }

  const summary = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      email: true,
      profile: { select: { displayName: true } },
      _count: {
        select: {
          pantryItems: true,
          mealPlanEntries: true,
          shoppingLists: true,
          nutritionLogs: true,
          favoriteRecipes: true,
          recipes: true,
        },
      },
    },
  });
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
