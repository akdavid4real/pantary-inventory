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

## Repository layout

```txt
.
├── src/                 # Existing React/Vite landing page
├── public/              # Frontend assets
├── backend/             # NestJS + Prisma + Supabase/Postgres API
├── package.json         # Frontend package
└── README.md
```

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
