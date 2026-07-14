ALTER TABLE "Recipe" ADD COLUMN "createdByUserId" TEXT;

CREATE INDEX "Recipe_createdByUserId_idx" ON "Recipe"("createdByUserId");

ALTER TABLE "Recipe"
ADD CONSTRAINT "Recipe_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
