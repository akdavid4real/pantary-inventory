CREATE INDEX IF NOT EXISTS "Recipe_isPublished_status_moderationStatus_imageUrl_idx"
ON "Recipe"("isPublished", "status", "moderationStatus", "imageUrl");

CREATE INDEX IF NOT EXISTS "Ingredient_imageUrl_name_idx"
ON "Ingredient"("imageUrl", "name");
