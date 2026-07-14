CREATE TYPE "RecipeStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "RecipeModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "RecipeReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

ALTER TABLE "Recipe"
  ADD COLUMN "status" "RecipeStatus" NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN "moderationStatus" "RecipeModerationStatus" NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN "moderationNote" TEXT,
  ADD COLUMN "moderatedAt" TIMESTAMP(3);

ALTER TABLE "ShoppingListItem"
  ADD COLUMN "unitCostNaira" DOUBLE PRECISION,
  ADD COLUMN "totalCostNaira" DOUBLE PRECISION,
  ADD COLUMN "purchasedAt" TIMESTAMP(3);

ALTER TABLE "PantryItemLog" ADD COLUMN "estimatedCostNaira" DOUBLE PRECISION;

CREATE TABLE "RecipeReport" (
  "id" TEXT NOT NULL,
  "recipeId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "details" TEXT,
  "status" "RecipeReportStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "RecipeReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MeasurementProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "cupMl" DOUBLE PRECISION NOT NULL DEFAULT 250,
  "tablespoonMl" DOUBLE PRECISION NOT NULL DEFAULT 15,
  "teaspoonMl" DOUBLE PRECISION NOT NULL DEFAULT 5,
  "dericaMl" DOUBLE PRECISION NOT NULL DEFAULT 1000,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MeasurementProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MeasurementOverride" (
  "id" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "ingredientId" TEXT NOT NULL,
  "fromUnit" TEXT NOT NULL,
  "toUnit" TEXT NOT NULL DEFAULT 'g',
  "multiplier" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MeasurementOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RecipeReport_recipeId_userId_key" ON "RecipeReport"("recipeId", "userId");
CREATE INDEX "RecipeReport_status_createdAt_idx" ON "RecipeReport"("status", "createdAt");
CREATE INDEX "Recipe_status_moderationStatus_idx" ON "Recipe"("status", "moderationStatus");
CREATE UNIQUE INDEX "MeasurementProfile_userId_name_key" ON "MeasurementProfile"("userId", "name");
CREATE INDEX "MeasurementProfile_userId_isDefault_idx" ON "MeasurementProfile"("userId", "isDefault");
CREATE UNIQUE INDEX "MeasurementOverride_profileId_ingredientId_fromUnit_toUnit_key" ON "MeasurementOverride"("profileId", "ingredientId", "fromUnit", "toUnit");
CREATE INDEX "MeasurementOverride_ingredientId_idx" ON "MeasurementOverride"("ingredientId");

ALTER TABLE "RecipeReport" ADD CONSTRAINT "RecipeReport_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecipeReport" ADD CONSTRAINT "RecipeReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MeasurementProfile" ADD CONSTRAINT "MeasurementProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MeasurementOverride" ADD CONSTRAINT "MeasurementOverride_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "MeasurementProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MeasurementOverride" ADD CONSTRAINT "MeasurementOverride_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
