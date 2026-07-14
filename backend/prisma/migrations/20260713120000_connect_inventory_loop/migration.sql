CREATE TYPE "ShoppingItemSource" AS ENUM ('GENERATED', 'MANUAL');

ALTER TABLE "ShoppingListItem"
  ADD COLUMN "source" "ShoppingItemSource" NOT NULL DEFAULT 'GENERATED',
  ADD COLUMN "storageLocation" "StorageLocation",
  ADD COLUMN "expiryDate" TIMESTAMP(3),
  ADD COLUMN "lowStockThreshold" DOUBLE PRECISION;

CREATE INDEX "ShoppingListItem_shoppingListId_source_idx"
  ON "ShoppingListItem"("shoppingListId", "source");
