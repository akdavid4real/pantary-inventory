# Pantry-to-Plate

Pantry-to-Plate is a smart meal planning ecosystem. The current frontend landing page remains in the repository root, while the backend API lives in `backend/`.

## Project direction

The backend is powered by **PlateSense Food Engine**, a custom Nigerian-aware food intelligence API built for this school project.

PlateSense handles:

- Pantry inventory and expiry tracking
- Nigerian/local ingredient database
- Local recipe database
- Pantry-to-recipe matching
- Missing ingredient detection
- Shopping list generation
- Meal planning
- Estimated nutrition summaries
- Cooking mode with pantry deduction
- Dashboard and recommendations
- Optional Gemini-assisted weekly meal planning with a safe PlateSense fallback

## Gemini setup

Create a Gemini API key in Google AI Studio and set it only in the backend
runtime environment:

```env
GEMINI_API_KEY=your-server-side-key
GEMINI_MODEL=gemini-2.5-flash
```

The Meals page then offers **Plan with Gemini**. Suggested meals are limited to
approved recipes already in the database and are not saved until the user
reviews and confirms the preview. Do not add the key to the Vite/frontend env.

The dashboard also includes **Food Scan**. On mobile it can open the rear camera;
on desktop it accepts an uploaded image. Gemini returns a structured description,
likely ingredients, possible allergens, an answer to the user's question, and a
clearly labeled nutrition estimate. The image is compressed in the browser and
is not saved in Pantry-to-Plate storage.

## Repository layout

```txt
.
├── src/                 # Existing React/Vite landing page
├── public/              # Frontend assets
├── backend/             # NestJS + Prisma + Supabase/Postgres API
├── package.json         # Frontend package
└── README.md
```

New to the backend? Read the team-friendly [backend concepts and file map](docs/BACKEND_GUIDE_FOR_TEAM.md).

## Backend quick start

```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run start:dev
```

Default API base URL:

```txt
http://localhost:4000/api/v1
```

Swagger docs:

```txt
http://localhost:4000/api/v1/docs
```

Health check:

```txt
GET http://localhost:4000/api/v1/health
```

## Demo auth

For local school demo mode, set this in `backend/.env`:

```env
AUTH_MODE=dev
```

Then send this header from Postman or the frontend:

```txt
x-user-id: demo-user
```

For admin routes, also set:

```env
ADMIN_EMAIL=admin@pantry-to-plate.local
```

and send:

```txt
x-user-email: admin@pantry-to-plate.local
```
