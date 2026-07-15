ALTER TABLE "UserProfile"
  ADD COLUMN "heightCm" DOUBLE PRECISION,
  ADD COLUMN "weightKg" DOUBLE PRECISION;

ALTER TABLE "UserPreference"
  ADD COLUMN "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "mealPlanReminders" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "groceryReminders" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "expiryAlerts" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "lowStockAlerts" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "weeklyInsights" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "RecipeFavorite" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "recipeId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecipeFavorite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RecipeFavorite_userId_recipeId_key" ON "RecipeFavorite"("userId", "recipeId");
CREATE INDEX "RecipeFavorite_userId_createdAt_idx" ON "RecipeFavorite"("userId", "createdAt");
CREATE INDEX "RecipeFavorite_recipeId_idx" ON "RecipeFavorite"("recipeId");

ALTER TABLE "RecipeFavorite"
  ADD CONSTRAINT "RecipeFavorite_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecipeFavorite"
  ADD CONSTRAINT "RecipeFavorite_recipeId_fkey"
  FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
