-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "IngredientCategory" AS ENUM ('GRAINS', 'PROTEIN', 'VEGETABLES', 'FRUITS', 'SPICES', 'OIL', 'SWALLOW', 'DAIRY', 'SEAFOOD', 'LEGUMES', 'TUBERS', 'CANNED_FOOD', 'FROZEN_FOOD', 'OTHER');

-- CreateEnum
CREATE TYPE "RecipeCategory" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SOUP', 'SWALLOW', 'RICE_MEAL', 'BEANS_MEAL', 'SNACK', 'PROTEIN', 'DRINK', 'OTHER');

-- CreateEnum
CREATE TYPE "StorageLocation" AS ENUM ('PANTRY', 'FRIDGE', 'FREEZER', 'COUNTER', 'OTHER');

-- CreateEnum
CREATE TYPE "PantryAdjustmentType" AS ENUM ('ADDED', 'USED', 'EXPIRED', 'REMOVED', 'BOUGHT', 'CORRECTED');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');

-- CreateEnum
CREATE TYPE "RecipeSource" AS ENUM ('LOCAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "ShoppingListStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ShoppingItemStatus" AS ENUM ('PENDING', 'BOUGHT', 'SKIPPED');

-- CreateEnum
CREATE TYPE "CookingSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "supabaseId" TEXT,
    "email" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dietaryPreference" TEXT,
    "allergies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "avoidedIngredients" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "calorieGoal" DOUBLE PRECISION,
    "proteinGoal" DOUBLE PRECISION,
    "carbsGoal" DOUBLE PRECISION,
    "fatGoal" DOUBLE PRECISION,
    "maxCookingMinutes" INTEGER,
    "preferNigerianMeals" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" "IngredientCategory" NOT NULL DEFAULT 'OTHER',
    "defaultUnit" TEXT NOT NULL DEFAULT 'g',
    "storageLocation" "StorageLocation" NOT NULL DEFAULT 'PANTRY',
    "shelfLifeDays" INTEGER,
    "averageCostNaira" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientAlias" (
    "id" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,

    CONSTRAINT "IngredientAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientNutrition" (
    "id" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "baseQuantity" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "baseUnit" TEXT NOT NULL DEFAULT 'g',
    "calories" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "protein" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carbs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fiber" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sugar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sodium" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "source" TEXT,

    CONSTRAINT "IngredientNutrition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitConversion" (
    "id" TEXT NOT NULL,
    "ingredientId" TEXT,
    "fromUnit" TEXT NOT NULL,
    "toUnit" TEXT NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,

    CONSTRAINT "UnitConversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" "RecipeCategory" NOT NULL DEFAULT 'OTHER',
    "region" TEXT,
    "imageUrl" TEXT,
    "servings" INTEGER NOT NULL DEFAULT 1,
    "prepTimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "cookTimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "difficulty" TEXT,
    "caloriesPerServing" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "proteinPerServing" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carbsPerServing" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fatPerServing" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeStep" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "instruction" TEXT NOT NULL,
    "durationMinutes" INTEGER,

    CONSTRAINT "RecipeStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeTag" (
    "recipeId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "RecipeTag_pkey" PRIMARY KEY ("recipeId","tagId")
);

-- CreateTable
CREATE TABLE "PantryItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "storageLocation" "StorageLocation" NOT NULL DEFAULT 'PANTRY',
    "lowStockThreshold" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PantryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PantryItemLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pantryItemId" TEXT,
    "ingredientId" TEXT,
    "type" "PantryAdjustmentType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PantryItemLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealPlanEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT,
    "recipeSource" "RecipeSource" NOT NULL DEFAULT 'LOCAL',
    "externalRecipeId" TEXT,
    "externalTitle" TEXT,
    "externalImageUrl" TEXT,
    "plannedDate" TIMESTAMP(3) NOT NULL,
    "mealType" "MealType" NOT NULL,
    "servings" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealPlanEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingList" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ShoppingListStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingListItem" (
    "id" TEXT NOT NULL,
    "shoppingListId" TEXT NOT NULL,
    "ingredientId" TEXT,
    "recipeId" TEXT,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "status" "ShoppingItemStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CookingSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "servings" INTEGER NOT NULL DEFAULT 1,
    "status" "CookingSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "CookingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CookingSessionStep" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "recipeStepId" TEXT,
    "stepNumber" INTEGER NOT NULL,
    "instruction" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CookingSessionStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT,
    "logDate" TIMESTAMP(3) NOT NULL,
    "mealType" "MealType",
    "servings" INTEGER NOT NULL DEFAULT 1,
    "calories" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "protein" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carbs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NutritionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseId_key" ON "User"("supabaseId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_name_key" ON "Ingredient"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_slug_key" ON "Ingredient"("slug");

-- CreateIndex
CREATE INDEX "Ingredient_category_idx" ON "Ingredient"("category");

-- CreateIndex
CREATE UNIQUE INDEX "IngredientAlias_normalized_key" ON "IngredientAlias"("normalized");

-- CreateIndex
CREATE INDEX "IngredientAlias_alias_idx" ON "IngredientAlias"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "IngredientNutrition_ingredientId_key" ON "IngredientNutrition"("ingredientId");

-- CreateIndex
CREATE INDEX "UnitConversion_fromUnit_toUnit_idx" ON "UnitConversion"("fromUnit", "toUnit");

-- CreateIndex
CREATE UNIQUE INDEX "UnitConversion_ingredientId_fromUnit_toUnit_key" ON "UnitConversion"("ingredientId", "fromUnit", "toUnit");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_slug_key" ON "Recipe"("slug");

-- CreateIndex
CREATE INDEX "Recipe_category_idx" ON "Recipe"("category");

-- CreateIndex
CREATE INDEX "Recipe_region_idx" ON "Recipe"("region");

-- CreateIndex
CREATE INDEX "Recipe_name_idx" ON "Recipe"("name");

-- CreateIndex
CREATE INDEX "RecipeIngredient_recipeId_idx" ON "RecipeIngredient"("recipeId");

-- CreateIndex
CREATE INDEX "RecipeIngredient_ingredientId_idx" ON "RecipeIngredient"("ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeStep_recipeId_stepNumber_key" ON "RecipeStep"("recipeId", "stepNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "PantryItem_userId_idx" ON "PantryItem"("userId");

-- CreateIndex
CREATE INDEX "PantryItem_userId_expiryDate_idx" ON "PantryItem"("userId", "expiryDate");

-- CreateIndex
CREATE INDEX "PantryItem_ingredientId_idx" ON "PantryItem"("ingredientId");

-- CreateIndex
CREATE INDEX "PantryItemLog_userId_idx" ON "PantryItemLog"("userId");

-- CreateIndex
CREATE INDEX "PantryItemLog_pantryItemId_idx" ON "PantryItemLog"("pantryItemId");

-- CreateIndex
CREATE INDEX "MealPlanEntry_userId_plannedDate_idx" ON "MealPlanEntry"("userId", "plannedDate");

-- CreateIndex
CREATE INDEX "MealPlanEntry_recipeId_idx" ON "MealPlanEntry"("recipeId");

-- CreateIndex
CREATE INDEX "ShoppingList_userId_status_idx" ON "ShoppingList"("userId", "status");

-- CreateIndex
CREATE INDEX "ShoppingListItem_shoppingListId_status_idx" ON "ShoppingListItem"("shoppingListId", "status");

-- CreateIndex
CREATE INDEX "ShoppingListItem_ingredientId_idx" ON "ShoppingListItem"("ingredientId");

-- CreateIndex
CREATE INDEX "CookingSession_userId_status_idx" ON "CookingSession"("userId", "status");

-- CreateIndex
CREATE INDEX "CookingSession_recipeId_idx" ON "CookingSession"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "CookingSessionStep_sessionId_stepNumber_key" ON "CookingSessionStep"("sessionId", "stepNumber");

-- CreateIndex
CREATE INDEX "NutritionLog_userId_logDate_idx" ON "NutritionLog"("userId", "logDate");

-- CreateIndex
CREATE INDEX "NutritionLog_recipeId_idx" ON "NutritionLog"("recipeId");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientAlias" ADD CONSTRAINT "IngredientAlias_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientNutrition" ADD CONSTRAINT "IngredientNutrition_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitConversion" ADD CONSTRAINT "UnitConversion_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeStep" ADD CONSTRAINT "RecipeStep_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeTag" ADD CONSTRAINT "RecipeTag_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeTag" ADD CONSTRAINT "RecipeTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryItem" ADD CONSTRAINT "PantryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryItem" ADD CONSTRAINT "PantryItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryItemLog" ADD CONSTRAINT "PantryItemLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryItemLog" ADD CONSTRAINT "PantryItemLog_pantryItemId_fkey" FOREIGN KEY ("pantryItemId") REFERENCES "PantryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanEntry" ADD CONSTRAINT "MealPlanEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanEntry" ADD CONSTRAINT "MealPlanEntry_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingList" ADD CONSTRAINT "ShoppingList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_shoppingListId_fkey" FOREIGN KEY ("shoppingListId") REFERENCES "ShoppingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CookingSession" ADD CONSTRAINT "CookingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CookingSession" ADD CONSTRAINT "CookingSession_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CookingSessionStep" ADD CONSTRAINT "CookingSessionStep_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CookingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CookingSessionStep" ADD CONSTRAINT "CookingSessionStep_recipeStepId_fkey" FOREIGN KEY ("recipeStepId") REFERENCES "RecipeStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionLog" ADD CONSTRAINT "NutritionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionLog" ADD CONSTRAINT "NutritionLog_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
