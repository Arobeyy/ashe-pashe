# Tech Stack & Project Setup — ashepashe

This is the entry-point context file. Read this first when onboarding to the project.

---

## Stack Summary

| Layer | Technology | Version |
| :--- | :--- | :--- |
| Framework | Next.js — App Router, React 19, TypeScript strict | 16.x |
| Database | SQLite via Prisma ORM | `prisma/dev.db` |
| Styling | Tailwind CSS v4 | |
| Components | shadcn/ui (base-nova) + Radix UI + lucide-react | |
| Maps | Leaflet + OpenStreetMap (`react-leaflet`, `ssr: false`) | |
| Auth | JWT via `jose` + `bcryptjs` — `HttpOnly` + `SameSite=Lax` cookies | |
| i18n | JSON dictionaries under `src/app/[lang]/dictionaries/` | en, bn |

**Hard constraints — never introduce:**
- PostgreSQL, Docker, SpatiaLite, C-extensions
- Any paid external API (maps, storage, etc.)
- Additional CSS frameworks

---

## Repository Structure

```
/
├── prisma/
│   └── schema.prisma          # Canonical DB schema
├── src/
│   ├── app/
│   │   ├── [lang]/            # i18n root layout + pages
│   │   │   ├── dictionaries/  # en.json, bn.json
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── api/               # Route Handlers (route.ts files)
│   │   ├── globals.css        # Design tokens — single source of truth
│   │   └── favicon.ico
│   ├── components/
│   │   ├── ui/                # shadcn primitives — do not hand-edit
│   │   └── [feature]/         # Feature-specific components
│   ├── lib/                   # Shared utilities (geo.ts, auth.ts, etc.)
│   ├── hooks/                 # Custom React hooks
│   ├── middleware.ts           # Auth guards
│   └── types/                 # Shared TypeScript types
├── docs/
│   ├── context/               # These CDD files — read before coding
│   ├── wireframes/            # Uploaded wireframe images
│   ├── openapi.yaml           # REST API spec
│   └── schema.dbml            # DB visual spec (dbdiagram.io)
├── public/
├── AGENTS.md                  # This file — project rules for AI agents
├── components.json            # shadcn config
├── next.config.ts
└── tsconfig.json
```

---

## Key Architecture Decisions

- **Monolith** — UI pages and API routes share one Next.js process on port 3000. No CORS, no separate backend service.
- **SQLite** — Zero local daemon overhead. All data in `prisma/dev.db`. Geo search uses bounding-box indexed queries + in-memory Haversine (see `04_GEO_ENGINE.md`).
- **Server Components default** — `"use client"` only when strictly necessary.
- **Leaflet always SSR-disabled** — import with `dynamic(..., { ssr: false })` or you get `window is not defined`.
- **Single responsive layout** — one component adapts to mobile/desktop rather than two parallel implementations.

---

## Environment Variables

```env
JWT_SECRET=          # Required — signs auth cookies
DATABASE_URL=        # Optional override; defaults to file:./prisma/dev.db
```

---

## Development

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev          # http://localhost:3000
```

