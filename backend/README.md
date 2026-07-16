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
| Meal Planner | Weekly calendar entries |
| Shopping List | Shopping list generation from recipes and meal plans |
| Nutrition | Recipe macros, daily summaries, weekly Chart.js-ready summaries |
| Cooking Mode | Step-by-step cooking, pantry deduction, nutrition logging |
| Dashboard | Dashboard summary cards |
| Recommendations | Pantry, expiry, low-budget, high-protein, and quick meal recommendations |
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
```

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
POST   /api/v1/shopping-list/generate/from-meal-plan
GET    /api/v1/nutrition/week
POST   /api/v1/cooking/start/:recipeId
POST   /api/v1/cooking/session/:sessionId/complete
```

## Important note

Nutrition values are estimates for academic/demo use. Do not present them as medical advice.
