# Pantry-to-Plate API

This is the NestJS backend for Pantry-to-Plate. It contains the **PlateSense Food Engine**, a custom food intelligence system for pantry-aware Nigerian meal planning.

## Stack

- NestJS
- TypeScript
- Prisma ORM
- Supabase PostgreSQL
- Swagger/OpenAPI

## Backend modules

| Module | Purpose |
|---|---|
| Auth | Supabase/demo auth guard and current user identity |
| Users | Profile, preferences, nutrition goals |
| Ingredients | Ingredient database, aliases, nutrition estimates |
| Recipes | Local Nigerian recipe database, recipe ingredients, steps, tags |
| Pantry | Pantry stock, expiry dates, low stock, stock logs |
| Recipe Matcher | Pantry-to-recipe matching and missing ingredient detection |
| Meal Planner | Weekly calendar entries and Gemini-assisted plan previews |
| Shopping List | Shopping list generation from recipes and meal plans |
| Nutrition | Recipe macros, daily summaries, weekly Chart.js-ready summaries |
| Cooking Mode | Step-by-step cooking, pantry deduction, nutrition logging |
| Dashboard | Dashboard summary cards |
| Recommendations | Pantry, expiry, low-budget, high-protein, and quick meal recommendations |
| Food Analysis | Gemini vision analysis for camera and uploaded food photos |
| Admin | Food database stats and demo seeding |

## Setup

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run start:dev
```

## Environment variables

```env
PORT=4000
API_PREFIX=api/v1
FRONTEND_URL=http://localhost:5173
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?schema=public"
AUTH_MODE=dev
SUPABASE_JWT_SECRET=
ADMIN_EMAIL=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

`GEMINI_API_KEY` is optional and must stay on the backend. When it is absent,
rate-limited, or unavailable, the same meal-plan preview endpoint falls back to
the deterministic PlateSense pantry ranking. The browser never receives the key.

## Gemini smart meal planning

The Meals screen can request a seven-meal preview. The backend removes recipes
that conflict with saved allergies, avoided ingredients, and maximum cooking
time before sending candidates to Gemini. Gemini can only choose approved
database recipe IDs and open calendar slots. Its structured response is
validated again, shown to the user for review, and saved only after confirmation.

Applying a preview is transactional: if a slot was filled after the preview was
created, nothing is written and the user is asked to generate a fresh plan.

## Gemini food photo analysis

The **Food Scan** dashboard page opens the rear camera on supported mobile
browsers and accepts JPEG, PNG, or WebP uploads elsewhere. The browser resizes
and compresses the image before sending it to the authenticated backend. The
backend verifies the image signature, enforces a 2.5 MB decoded limit, and asks
Gemini for a structured dish, ingredient, allergen, and estimated nutrition
analysis. Images are not written to application storage, and Gemini interaction
storage is disabled for these requests.

Photo nutrition is deliberately presented as an estimate because actual
portions and preparation methods cannot be confirmed from an image alone.

## Core API flow

```txt
Add pantry items
→ Match recipes from pantry
→ Add recipe to meal plan
→ Generate shopping list
→ View weekly nutrition
→ Start cooking mode
→ Complete cooking
→ Pantry stock is deducted
```

## Catalog import

The completed JSON batches under `../info` are imported through a guarded,
idempotent catalog command. It reuses images already stored in Supabase and
does not upload or overwrite storage objects.

```bash
# Local JSON and asset validation. Does not connect to the database.
pnpm catalog:check

# Read the current object counts from the linked Supabase Storage buckets.
pnpm catalog:storage

# Read-only comparison with the database and live Supabase buckets.
pnpm catalog:reconcile

# Link only missing recipe imageUrl values after reviewing reconciliation.
pnpm catalog:apply-recipe-images

# Explicit write mode. Run only after reviewing the reconciliation report.
pnpm catalog:apply
```

The importer reads the linked project's live `recipe-images` and
`ingredient-images` bucket listings through the Supabase CLI. When
`SUPABASE_SERVICE_ROLE_KEY` is configured, it uses the Storage API instead.
`catalog:apply-recipe-images` only fills blank recipe image URLs; the full
`catalog:apply` command also requires a real Platform Admin, resolved through
`CATALOG_ADMIN_USER_ID` or an existing user matching `ADMIN_EMAIL`. Imported
recipes remain drafts unless the JSON review status is `Approved`.

## Useful endpoints

```txt
GET    /api/v1/health
GET    /api/v1/auth/me
GET    /api/v1/dashboard/summary
GET    /api/v1/ingredients
GET    /api/v1/recipes
GET    /api/v1/pantry
POST   /api/v1/pantry
GET    /api/v1/recipe-matcher/from-pantry
POST   /api/v1/meal-planner/ai/preview
POST   /api/v1/meal-planner/ai/apply
POST   /api/v1/food-analysis/photo
POST   /api/v1/shopping-list/generate/from-meal-plan
GET    /api/v1/nutrition/week
POST   /api/v1/cooking/start/:recipeId
POST   /api/v1/cooking/session/:sessionId/complete
```

## Important note

Nutrition values are estimates for academic/demo use. Do not present them as medical advice.
