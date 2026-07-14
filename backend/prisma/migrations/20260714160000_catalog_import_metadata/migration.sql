ALTER TABLE "Ingredient"
  ADD COLUMN "catalogId" TEXT,
  ADD COLUMN "isPantryItem" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "pantryPriority" INTEGER,
  ADD COLUMN "essential" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "seasons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "substitutes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "allergens" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "Recipe"
  ADD COLUMN "moderatedByUserId" TEXT,
  ADD COLUMN "catalogId" TEXT,
  ADD COLUMN "catalogBatch" TEXT,
  ADD COLUMN "catalogVersion" TEXT,
  ADD COLUMN "catalogReviewStatus" TEXT,
  ADD COLUMN "catalogSourceReferences" JSONB,
  ADD COLUMN "localAssetHint" TEXT,
  ADD COLUMN "mealTypes" "MealType"[] NOT NULL DEFAULT ARRAY[]::"MealType"[],
  ADD COLUMN "spiceLevel" TEXT,
  ADD COLUMN "cuisine" TEXT,
  ADD COLUMN "seasons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "difficultyScore" INTEGER,
  ADD COLUMN "catalogImportedAt" TIMESTAMP(3);

CREATE TABLE "IngredientPriceDefault" (
  "id" TEXT NOT NULL,
  "ingredientId" TEXT NOT NULL,
  "priceNaira" DOUBLE PRECISION NOT NULL,
  "packageQuantity" DOUBLE PRECISION NOT NULL,
  "packageUnit" TEXT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "priceRegion" TEXT NOT NULL DEFAULT 'Nigeria',
  "priceEditable" BOOLEAN NOT NULL DEFAULT true,
  "effectiveAt" TIMESTAMP(3),
  "source" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IngredientPriceDefault_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Ingredient_catalogId_key" ON "Ingredient"("catalogId");
CREATE UNIQUE INDEX "Recipe_catalogId_key" ON "Recipe"("catalogId");
CREATE INDEX "Recipe_moderatedByUserId_idx" ON "Recipe"("moderatedByUserId");
CREATE UNIQUE INDEX "IngredientPriceDefault_ingredientId_priceRegion_currency_key"
  ON "IngredientPriceDefault"("ingredientId", "priceRegion", "currency");
CREATE INDEX "IngredientPriceDefault_ingredientId_idx" ON "IngredientPriceDefault"("ingredientId");

ALTER TABLE "Recipe"
  ADD CONSTRAINT "Recipe_moderatedByUserId_fkey"
  FOREIGN KEY ("moderatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "IngredientPriceDefault"
  ADD CONSTRAINT "IngredientPriceDefault_ingredientId_fkey"
  FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
