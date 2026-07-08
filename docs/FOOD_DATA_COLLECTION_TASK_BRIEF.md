# Pantry-to-Plate Food Data Collection Task Brief

**Project:** Pantry-to-Plate  
**Backend engine:** PlateSense Food Engine  
**Database:** Supabase PostgreSQL through Prisma  
**Document owner:** Backend/Data Lead  
**Purpose:** Give the team a clear, practical data collection assignment for ingredients, recipes, images, nutrition, aliases, cooking steps, and verification.

---

## 1. Why this task exists

Pantry-to-Plate depends heavily on food data. The backend can already store ingredients, recipes, pantry items, recipe matching information, shopping lists, nutrition logs, and cooking steps, but the current database only has starter seed data.

The current seed is enough for testing, but it is not enough for a complete school project demo. Some fields are still empty, including recipe images, ingredient descriptions, shelf life, average cost, recipe difficulty, image URLs, better nutrition sources, and more complete recipe coverage.

The data team must expand and verify the food database so the backend can power:

- Pantry inventory
- Recipe discovery
- Recipe matching
- Missing ingredient detection
- Shopping list generation
- Meal planning
- Nutrition dashboard
- Cooking mode
- Dashboard summaries

The backend logic will only look smart if the food data is rich, consistent, and verified.

---

## 2. Main rule for the team

The data team should focus on **data research, data cleaning, image sourcing, and verification**.

Do **not** edit backend logic, database schema, Prisma schema, controllers, services, or API files unless the backend lead specifically assigns that work.

The team's main deliverables are structured spreadsheets and verified source links that can be imported into Supabase/PostgreSQL.

---

## 3. Current state of the food database

The starter seed currently contains approximately:

- **15 ingredients**
- **5 Nigerian/local recipes**
- Basic recipe ingredient quantities
- Basic recipe cooking steps
- Basic estimated calories, protein, carbs, and fat
- A few aliases such as `garri/gari`, `crayfish/dried crayfish`, `pepper/ata rodo`, and `ugu/fluted pumpkin leaf`

This is not enough.

### Current starter recipes

- Jollof Rice
- Beans and Plantain
- Yam Porridge
- Egusi Soup and Garri
- Akara

### Current starter ingredients

- rice
- beans
- yam
- plantain
- tomato
- pepper
- onion
- vegetable oil
- palm oil
- chicken
- egg
- egusi
- garri
- dried crayfish
- spinach / ugu

---

## 4. Required MVP data target

The team must expand the data to the following minimum targets:

| Data type | Minimum target | Strong target |
|---|---:|---:|
| Ingredients | 50+ | 100+ |
| Ingredient aliases | 100+ | 250+ |
| Recipes | 20-30 | 50+ |
| Recipe ingredient rows | 150+ | 400+ |
| Recipe steps | 100+ | 250+ |
| Recipe images | 20-30 | 50+ |
| Ingredient images | 50+ | 100+ |
| Nutrition sources | 50+ | 100+ |
| Unit conversion notes | 30+ | 80+ |

The minimum acceptable school-project target is **50 ingredients and 20-30 recipes**.

---

## 5. Tables the data team must understand

The food data mainly enters these database tables:

| Table | Purpose | Who fills it? |
|---|---|---|
| `Ingredient` | Master list of ingredients | Data team |
| `IngredientAlias` | Local names and spelling variants | Data team |
| `IngredientNutrition` | Calories, protein, carbs, fat, etc. | Data team |
| `UnitConversion` | Unit conversion rules | Data team |
| `Recipe` | Main recipe record | Data team |
| `RecipeIngredient` | Ingredients required by each recipe | Data team |
| `RecipeStep` | Step-by-step cooking instructions | Data team |
| `Tag` | Labels such as Nigerian, high-protein, quick-meal | Data team |
| `RecipeTag` | Link recipes to tags | Data team |

User-generated tables such as `PantryItem`, `MealPlanEntry`, `ShoppingList`, `CookingSession`, and `NutritionLog` are created by app users during usage. The data team does not manually fill those for the main food database.

---

## 6. Empty or weak fields that must be improved

The screenshots show several fields are currently empty or weak. These must be filled where possible.

### Ingredient table fields to improve

| Field | Current issue | Required action |
|---|---|---|
| `description` | Mostly NULL | Add a short useful description |
| `shelfLifeDays` | Mostly NULL | Estimate shelf life in days |
| `averageCostNaira` | Mostly NULL | Add rough Nigerian market price estimate where possible |
| `storageLocation` | Mostly PANTRY | Check if item should be PANTRY, FRIDGE, FREEZER, or COUNTER |
| `defaultUnit` | Basic | Confirm correct default unit |

### Recipe table fields to improve

| Field | Current issue | Required action |
|---|---|---|
| `imageUrl` | NULL | Add image URL or local image reference |
| `difficulty` | NULL | Add Easy, Medium, or Hard |
| `prepTimeMinutes` | Basic estimate | Verify and improve |
| `cookTimeMinutes` | Basic estimate | Verify and improve |
| `caloriesPerServing` | Basic estimate | Verify and improve |
| `proteinPerServing` | Basic estimate | Verify and improve |
| `carbsPerServing` | Basic estimate | Verify and improve |
| `fatPerServing` | Basic estimate | Verify and improve |

### RecipeStep table fields to improve

| Field | Current issue | Required action |
|---|---|---|
| `instruction` | Some steps are too short | Make steps clearer and complete |
| `durationMinutes` | NULL | Add estimated duration per step where possible |

---

## 7. Spreadsheet workbook structure

The team should create one Excel workbook named:

```txt
pantry_to_plate_food_data_collection.xlsx
```

It should contain these sheets:

1. `Ingredients`
2. `IngredientAliases`
3. `IngredientNutrition`
4. `UnitConversions`
5. `Recipes`
6. `RecipeIngredients`
7. `RecipeSteps`
8. `RecipeTags`
9. `Images`
10. `SourcesAndVerification`
11. `ReviewStatus`

Every row must have a source or verification note.

---

## 8. Sheet 1: Ingredients

This sheet is for the `Ingredient` table.

### Required columns

| Column | Required? | Example | Notes |
|---|---|---|---|
| `name` | Yes | rice | Lowercase preferred |
| `slug` | Yes | rice | Use hyphen format, e.g. palm-oil |
| `description` | Yes | Staple grain used in many Nigerian rice dishes | Short but useful |
| `category` | Yes | GRAINS | Must match backend enum |
| `defaultUnit` | Yes | g | Use g, ml, piece, bunch, cup, etc. |
| `storageLocation` | Yes | PANTRY | PANTRY, FRIDGE, FREEZER, COUNTER, OTHER |
| `shelfLifeDays` | Yes | 365 | Estimate shelf life |
| `averageCostNaira` | Optional but useful | 2500 | Rough market price estimate |
| `imageUrl` | Yes | URL | Clear ingredient image |
| `imageSource` | Yes | URL/source name | Must show where image came from |
| `dataSource` | Yes | URL/source name | Source for description/category/shelf life |
| `verifiedBy` | Yes | Team member name | Who checked it |
| `reviewStatus` | Yes | Pending / Approved / Needs Fix | Used by lead reviewer |

### Allowed ingredient categories

Use only these category values:

```txt
GRAINS
PROTEIN
VEGETABLES
FRUITS
SPICES
OIL
SWALLOW
DAIRY
SEAFOOD
LEGUMES
TUBERS
CANNED_FOOD
FROZEN_FOOD
OTHER
```

### Allowed storage locations

Use only these values:

```txt
PANTRY
FRIDGE
FREEZER
COUNTER
OTHER
```

---

## 9. Sheet 2: IngredientAliases

This sheet is for local names, spelling variants, and common market names.

### Required columns

| Column | Required? | Example |
|---|---|---|
| `ingredientSlug` | Yes | pepper |
| `alias` | Yes | ata rodo |
| `normalized` | Yes | ata rodo |
| `languageOrRegion` | Optional | Yoruba |
| `notes` | Optional | Common Nigerian market name |
| `source` | Yes | Link or explanation |
| `verifiedBy` | Yes | Team member name |

### Examples

| ingredientSlug | alias | normalized |
|---|---|---|
| garri | gari | gari |
| garri | cassava flakes | cassava flakes |
| pepper | ata rodo | ata rodo |
| pepper | scotch bonnet | scotch bonnet |
| spinach | ugu | ugu |
| spinach | fluted pumpkin leaf | fluted pumpkin leaf |
| dried-crayfish | crayfish | crayfish |
| seasoning-cube | maggi | maggi |
| seasoning-cube | knorr | knorr |
| locust-beans | iru | iru |

---

## 10. Sheet 3: IngredientNutrition

This sheet is for nutrition estimates per ingredient.

### Required columns

| Column | Required? | Example | Notes |
|---|---|---|---|
| `ingredientSlug` | Yes | rice | Must match Ingredients sheet |
| `baseQuantity` | Yes | 100 | Usually 100 |
| `baseUnit` | Yes | g | g, ml, piece |
| `calories` | Yes | 365 | Per base quantity |
| `protein` | Yes | 7 | In grams |
| `carbs` | Yes | 80 | In grams |
| `fat` | Yes | 1 | In grams |
| `fiber` | Optional | 1.3 | In grams |
| `sugar` | Optional | 0.1 | In grams |
| `sodium` | Optional | 5 | In mg |
| `source` | Yes | Source URL/name | Required |
| `confidence` | Yes | High / Medium / Low | Based on source quality |
| `notes` | Optional | Values are approximate | Use for uncertainty |

### Nutrition rule

Do not invent nutrition numbers randomly. Use a nutrition source and record that source. If the source gives values per 100g, keep `baseQuantity = 100` and `baseUnit = g`.

All nutrition should be treated as **estimated**, not medical advice.

---

## 11. Sheet 4: UnitConversions

This sheet helps the nutrition engine and shopping list understand different measurements.

### Required columns

| Column | Required? | Example |
|---|---|---|
| `ingredientSlug` | Optional | rice |
| `fromUnit` | Yes | cup |
| `toUnit` | Yes | g |
| `multiplier` | Yes | 185 |
| `notes` | Yes | 1 cup rice is approximately 185g |
| `source` | Yes | Link or explanation |
| `confidence` | Yes | High / Medium / Low |

### Common conversions to research

| Conversion | Notes |
|---|---|
| cup to g | Needed for rice, beans, garri, flour-like ingredients |
| tablespoon to ml | Needed for oil and liquid ingredients |
| teaspoon to ml | Needed for small liquid/spice measurements |
| piece to g | Needed for tomato, pepper, onion, egg, plantain |
| bunch to g | Needed for vegetables like ugu, spinach, waterleaf |
| cube to g | Needed for seasoning cubes |

---

## 12. Sheet 5: Recipes

This sheet is for the `Recipe` table.

### Required columns

| Column | Required? | Example |
|---|---|---|
| `name` | Yes | Jollof Rice |
| `slug` | Yes | jollof-rice |
| `description` | Yes | Nigerian rice dish cooked in tomato and pepper sauce |
| `category` | Yes | RICE_MEAL |
| `region` | Yes | Nigeria / Yoruba / Igbo / Hausa / South-South |
| `imageUrl` | Yes | URL |
| `imageSource` | Yes | URL/source name |
| `servings` | Yes | 4 |
| `prepTimeMinutes` | Yes | 20 |
| `cookTimeMinutes` | Yes | 45 |
| `difficulty` | Yes | Easy / Medium / Hard |
| `caloriesPerServing` | Yes | 620 |
| `proteinPerServing` | Yes | 28 |
| `carbsPerServing` | Yes | 82 |
| `fatPerServing` | Yes | 18 |
| `tags` | Yes | Nigerian, family-meal, rice-meal |
| `recipeSource1` | Yes | Source URL/name |
| `recipeSource2` | Recommended | Source URL/name |
| `verifiedBy` | Yes | Team member name |
| `reviewStatus` | Yes | Pending / Approved / Needs Fix |

### Allowed recipe categories

Use only these values:

```txt
BREAKFAST
LUNCH
DINNER
SOUP
SWALLOW
RICE_MEAL
BEANS_MEAL
SNACK
PROTEIN
DRINK
OTHER
```

---

## 13. Sheet 6: RecipeIngredients

This sheet links recipes to ingredients.

### Required columns

| Column | Required? | Example |
|---|---|---|
| `recipeSlug` | Yes | jollof-rice |
| `ingredientSlug` | Yes | rice |
| `quantity` | Yes | 500 |
| `unit` | Yes | g |
| `isOptional` | Yes | false |
| `notes` | Optional | Parboiled rice preferred |
| `source` | Yes | Recipe source or verification note |
| `verifiedBy` | Yes | Team member name |

### Important rule

Every ingredient used in a recipe must already exist in the `Ingredients` sheet.

Do not use random ingredient names in recipes. If a recipe needs `stockfish`, then `stockfish` must be added to the `Ingredients` sheet first.

---

## 14. Sheet 7: RecipeSteps

This sheet is for step-by-step cooking mode.

### Required columns

| Column | Required? | Example |
|---|---|---|
| `recipeSlug` | Yes | jollof-rice |
| `stepNumber` | Yes | 1 |
| `instruction` | Yes | Blend tomato, pepper, and onion into a smooth sauce. |
| `durationMinutes` | Recommended | 5 |
| `notes` | Optional | Can be skipped if using already-blended pepper mix |
| `source` | Yes | Recipe source or verification note |
| `verifiedBy` | Yes | Team member name |

### Step writing rules

Good recipe steps should be:

- Clear
- Short enough to display in cooking mode
- Ordered correctly
- Action-based
- Not copied word-for-word from one source
- Verified by comparing at least one source or real cooking knowledge

Bad step:

```txt
Cook it.
```

Good step:

```txt
Add the washed rice to the tomato sauce, add stock or water, cover the pot, and cook on low heat until the rice is soft.
```

---

## 15. Sheet 8: RecipeTags

This sheet controls filters and recommendations.

### Required columns

| Column | Required? | Example |
|---|---|---|
| `recipeSlug` | Yes | jollof-rice |
| `tagSlug` | Yes | nigerian |
| `tagName` | Yes | Nigerian |
| `reason` | Optional | General Nigerian dish |

### Recommended tags

```txt
nigerian
student-friendly
family-meal
quick-meal
high-protein
low-budget
high-carb
spicy
vegetarian
breakfast
lunch
dinner
rice-meal
beans-meal
soup
swallow
snack
weight-loss-friendly
traditional
party-food
```

---

## 16. Sheet 9: Images

Images are important because the frontend needs recipe and ingredient pictures.

### Required columns

| Column | Required? | Example |
|---|---|---|
| `itemType` | Yes | ingredient / recipe |
| `itemSlug` | Yes | jollof-rice |
| `imageUrl` | Yes | URL |
| `imageSourceName` | Yes | Website or photographer name |
| `imageSourceUrl` | Yes | URL |
| `licenseOrPermission` | Yes | Unsplash / Pexels / Wikimedia / Own photo / Permission needed |
| `imageQuality` | Yes | Good / Medium / Poor |
| `isUsable` | Yes | Yes / No |
| `notes` | Optional | Prefer image with white background |
| `verifiedBy` | Yes | Team member name |

### Image rules

- Do not use random copyrighted images without recording the source.
- Prefer own photos, public-domain images, Wikimedia Commons, Unsplash, Pexels, or images with clear permission.
- Image must clearly show the food or ingredient.
- Avoid blurry, watermarked, stretched, or low-resolution images.
- For recipes, image should show the cooked final meal.
- For ingredients, image should show the raw ingredient clearly.

### Image target

| Item | Minimum |
|---|---:|
| Recipe images | 20-30 |
| Ingredient images | 50+ |

---

## 17. Sheet 10: SourcesAndVerification

This sheet tracks where the information came from.

### Required columns

| Column | Required? | Example |
|---|---|---|
| `dataType` | Yes | recipe / nutrition / image / shelf-life / cost |
| `itemSlug` | Yes | jollof-rice |
| `sourceTitle` | Yes | Example recipe website |
| `sourceUrl` | Yes if online | URL |
| `sourceType` | Yes | Website / Book / Interview / Own knowledge / Market survey |
| `dateChecked` | Yes | 2026-07-08 |
| `checkedBy` | Yes | Team member name |
| `confidence` | Yes | High / Medium / Low |
| `notes` | Optional | Used only for cooking time, not nutrition |

### Verification rule

Every recipe should have at least **two references** where possible:

1. One source for the recipe structure
2. One source or verification note for cooking time, ingredient quantity, or nutrition estimate

---

## 18. Sheet 11: ReviewStatus

This sheet helps the project lead know what is complete.

### Required columns

| Column | Required? | Example |
|---|---|---|
| `itemType` | Yes | recipe |
| `itemSlug` | Yes | jollof-rice |
| `assignedTo` | Yes | Team member name |
| `status` | Yes | Not Started / In Progress / Submitted / Needs Fix / Approved |
| `reviewedBy` | Optional | Backend/Data Lead |
| `reviewDate` | Optional | 2026-07-08 |
| `issuesFound` | Optional | Missing image source |
| `fixDeadline` | Optional | 2026-07-10 |

---

## 19. Recipe list to research first

Start with these Nigerian meals before adding others.

### Priority recipes

| No. | Recipe | Category | Notes |
|---:|---|---|---|
| 1 | Jollof Rice | RICE_MEAL | Already seeded, improve data |
| 2 | Fried Rice | RICE_MEAL | Add |
| 3 | White Rice and Stew | RICE_MEAL | Add |
| 4 | Ofada Rice and Sauce | RICE_MEAL | Add |
| 5 | Beans and Plantain | BEANS_MEAL | Already seeded, improve data |
| 6 | Beans Porridge | BEANS_MEAL | Add |
| 7 | Moi Moi | BREAKFAST / SNACK | Add |
| 8 | Akara | BREAKFAST | Already seeded, improve data |
| 9 | Yam Porridge | LUNCH | Already seeded, improve data |
| 10 | Boiled Yam and Egg Sauce | BREAKFAST / LUNCH | Add |
| 11 | Egusi Soup and Garri | SOUP | Already seeded, improve data |
| 12 | Ogbono Soup | SOUP | Add |
| 13 | Okra Soup | SOUP | Add |
| 14 | Efo Riro | SOUP | Add |
| 15 | Afang Soup | SOUP | Add |
| 16 | Edikang Ikong | SOUP | Add |
| 17 | Banga Soup | SOUP | Add |
| 18 | Pepper Soup | SOUP | Add |
| 19 | Eba | SWALLOW | Add as standalone swallow or paired recipe |
| 20 | Pounded Yam | SWALLOW | Add |
| 21 | Amala | SWALLOW | Add |
| 22 | Semo | SWALLOW | Add |
| 23 | Suya | PROTEIN / SNACK | Add |
| 24 | Noodles and Egg | QUICK_MEAL | Add student-friendly |
| 25 | Abacha | SNACK / LUNCH | Add |
| 26 | Nkwobi | PROTEIN / SNACK | Add |
| 27 | Ukwa | LUNCH | Add |
| 28 | Plantain and Egg | BREAKFAST | Add |
| 29 | Spaghetti Jollof | LUNCH / DINNER | Add |
| 30 | Coconut Rice | RICE_MEAL | Add |

---

## 20. Ingredient list to research first

Start with these ingredients.

### Grains and staples

```txt
rice
spaghetti
noodles
garri
semovita
wheat swallow
poundo yam
flour
corn
pap / ogi
```

### Tubers and fruits

```txt
yam
plantain
potato
sweet potato
cocoyam
cassava
```

### Legumes

```txt
beans
black-eyed peas
brown beans
ukwa
soybeans
```

### Vegetables and leaves

```txt
tomato
pepper
red bell pepper
onion
spinach
ugu
waterleaf
bitter leaf
okra
scent leaf
curry leaf
cabbage
carrot
green peas
green beans
```

### Proteins

```txt
chicken
beef
goat meat
fish
smoked fish
stockfish
ponmo
egg
turkey
crayfish
shrimp
```

### Oils, spices, and seasonings

```txt
palm oil
vegetable oil
groundnut oil
seasoning cube
salt
curry powder
thyme
ginger
garlic
locust beans / iru
suya spice
nutmeg
bay leaf
```

### Soup ingredients

```txt
egusi
ogbono
achi
ofor
banga spice
melon seed
cocoyam thickener
```

---

## 21. Data quality checklist

Before submitting any row, check the following:

- Name is spelled correctly
- Slug uses lowercase and hyphen format
- Category matches backend enum
- Unit is consistent
- Image URL is provided
- Image source is provided
- Nutrition source is provided
- Recipe ingredients exist in Ingredients sheet
- Recipe steps are ordered correctly
- Cooking time looks realistic
- Serving size is included
- Recipe has at least one tag
- Reviewer name is filled
- Status is not left blank

Rows that do not pass these checks should be marked as `Needs Fix`.

---

## 22. Team assignment plan

Use this allocation to keep work organized.

### Team Member A: Ingredients Master Data

Responsible for:

- Ingredients sheet
- Ingredient descriptions
- Categories
- Default units
- Storage location
- Shelf life
- Average cost estimate

Minimum target:

- 50 ingredients

Strong target:

- 100 ingredients

### Team Member B: Aliases, Nutrition, and Unit Conversions

Responsible for:

- IngredientAliases sheet
- IngredientNutrition sheet
- UnitConversions sheet
- Nutrition sources
- Local Nigerian names
- Spelling variants

Minimum target:

- 100 aliases
- 50 nutrition entries
- 30 conversion notes

Strong target:

- 250 aliases
- 100 nutrition entries
- 80 conversion notes

### Team Member C: Recipes and Cooking Steps

Responsible for:

- Recipes sheet
- RecipeIngredients sheet
- RecipeSteps sheet
- RecipeTags sheet
- Prep time
- Cook time
- Difficulty
- Servings

Minimum target:

- 20-30 recipes

Strong target:

- 50 recipes

### Team Member D: Images and Sources

Responsible for:

- Images sheet
- Recipe images
- Ingredient images
- Image source links
- License/permission notes
- Image quality review

Minimum target:

- 20-30 recipe images
- 50 ingredient images

Strong target:

- 50 recipe images
- 100 ingredient images

### Team Member E: Data QA and Verification

Responsible for:

- SourcesAndVerification sheet
- ReviewStatus sheet
- Checking duplicates
- Checking missing fields
- Checking invalid categories
- Checking bad image links
- Checking source quality
- Checking final workbook before import

Minimum target:

- Review all submitted rows

---

## 23. Suggested work timeline

### Day 1: Setup and assignment

- Share this document with all team members
- Create the Excel workbook
- Assign members to sheets
- Confirm naming rules and categories

### Day 2-3: Ingredient research

- Fill at least 50 ingredients
- Fill aliases
- Fill nutrition estimates
- Add image links

### Day 4-5: Recipe research

- Fill 20-30 recipes
- Add recipe ingredients
- Add cooking steps
- Add image links
- Add recipe tags

### Day 6: Verification

- Check sources
- Fix missing fields
- Remove duplicates
- Confirm all slugs match

### Day 7: Import preparation

- Submit final workbook
- Backend lead reviews
- Convert spreadsheet rows into seed/import format
- Import into Supabase

---

## 24. Import readiness checklist

The spreadsheet is ready for backend import only when:

- Every recipe has a slug
- Every ingredient has a slug
- Every recipe ingredient references a valid ingredient slug
- Every recipe has steps
- Every recipe has nutrition estimates
- Every recipe has an image or image task marked pending
- Every ingredient has a category
- Every ingredient has a default unit
- Every image has a source
- Every nutrition entry has a source
- No required cells are blank
- ReviewStatus is Approved for all MVP rows

---

## 25. What should not be accepted

Reject rows with:

- No source
- No image source
- Random copied text without verification
- Missing slug
- Wrong enum value
- Ingredient not found in Ingredients sheet
- Recipe ingredient with no quantity
- Recipe step with unclear instruction
- Nutrition values with no source
- Watermarked or unclear images
- Duplicate recipe with different spelling

---

## 26. Final deliverables from the data team

The team must submit:

1. `pantry_to_plate_food_data_collection.xlsx`
2. A folder of downloaded/owned images if local images are used
3. A list of all online image URLs
4. A list of all nutrition/data sources
5. A review status sheet showing what is approved and what still needs fixing

---

## 27. Final note to the team

This task is not just data entry. It is the foundation of the whole app.

If the data is weak, the recipe matcher will look weak. If the recipe ingredients are wrong, the shopping list will be wrong. If the nutrition values are not checked, the dashboard will be misleading. If images are missing, the frontend will look unfinished.

The goal is to make PlateSense feel like a real Nigerian-aware food engine, not just a few hardcoded recipes.
