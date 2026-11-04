<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# ashepashe (আশেপাশে) — Agent Rules & Project Standards

## 1. Code Comment Rules
- Max **one line** per comment. If you need more, the code needs to be simplified.
- Only comment non-obvious logic. Never comment what the code already clearly says.
- No block comments, no JSDoc on internal functions. JSDoc is allowed only on exported library functions.
- NEVER SKIP THESE COMMENT RULES.

---

## 2. Context Files — Read Before Working

| File | When to Read |
| :--- | :--- |
| [`docs/context/01_TECH_STACK_AND_SETUP.md`](docs/context/01_TECH_STACK_AND_SETUP.md) | Onboarding, project structure, env setup |
| [`docs/context/02_PROJECT_OVERVIEW_AND_SCOPE.md`](docs/context/02_PROJECT_OVERVIEW_AND_SCOPE.md) | Starting any new feature — check MVP scope guard |
| [`docs/context/03_DATABASE_SCHEMA.md`](docs/context/03_DATABASE_SCHEMA.md) | Any Prisma model or DB query work |
| [`docs/context/04_GEO_ENGINE.md`](docs/context/04_GEO_ENGINE.md) | Any location/map/search feature |
| [`docs/context/05_API_CONTRACT.md`](docs/context/05_API_CONTRACT.md) | Any API route implementation |
| [`docs/context/06_DESIGN_SYSTEM.md`](docs/context/06_DESIGN_SYSTEM.md) | Any UI/styling work — token rules are mandatory |
| [`docs/context/07_RESPONSIVE_LAYOUT.md`](docs/context/07_RESPONSIVE_LAYOUT.md) | Any UI component — mobile + desktop views both required |

---

## 3. Wireframe Check Rule ⚠️

**Before implementing any UI feature**, check `docs/wireframes/` for a matching wireframe.
the wireframes are not a constitute, rather an inspiration for the design. don't follow it blidnly.
if possible, give the user more options to choose from if you think there is a better and more user friendly design possible.

```
docs/wireframes/
  
```

- If a wireframe exists → make inspired design from those.
- If no wireframe exists → try to follow the design guide and the design system. ask the user for opinion given some options.
- New wireframes the user uploads are always placed in `docs/wireframes/`.

---

## 4. Tech Stack (Locked)

| Layer | Technology |
| :--- | :--- |
| Framework | Next.js 16 — App Router, React 19, TypeScript strict |
| Database | SQLite via Prisma ORM (`prisma/dev.db`) |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (base-nova) + Radix UI + lucide-react |
| Maps | Leaflet + OpenStreetMap (`react-leaflet`) — `ssr: false` |
| Auth | JWT via `jose` + `bcryptjs` in `HttpOnly` + `SameSite=Lax` cookies |

**Do not introduce**: PostgreSQL, Docker, SpatiaLite, any paid API keys, or additional CSS frameworks.

---

## 5. Design Token Rules (Mandatory)

All styling **must** use Shadcn/Tailwind design tokens defined in `src/app/globals.css`.

**FORBIDDEN anywhere in the codebase**:
- Arbitrary Tailwind values: `bg-[#hex]`, `text-[14px]`, `p-[22px]`, `rounded-[8px]`
- Hardcoded colors, spacing, or radii outside `globals.css`
- Inline `style={{}}` for values that should be tokens

To retheme the entire app, modify the CSS variables in `globals.css` only. See [`docs/context/06_DESIGN_SYSTEM.md`](docs/context/06_DESIGN_SYSTEM.md).

---

## 6. Next.js Rules

- **App Router only** — no `pages/` directory.
- **Server Components by default** — add `"use client"` only when strictly necessary (event handlers, hooks, browser APIs).
- **API routes** live in `src/app/api/` as Route Handlers (`route.ts`).
- **Dynamic imports** — Leaflet and any browser-only library must use `dynamic(() => import(...), { ssr: false })`.
- **Never fetch from API routes inside Server Components** — call the business logic function directly.
- **Middleware** for auth guards lives in `src/middleware.ts`.
- Read `node_modules/next/dist/docs/` for this version's specific API before writing any Next.js code.

---

## 7. TypeScript Rules

- **Strict mode** is on — no `any`, no `as any`, no `@ts-ignore`.
- Define types/interfaces in `src/types/` for shared shapes; colocate local types near usage.
- Use `type` for unions and object shapes; use `interface` only for extendable contracts.
- Prefer `unknown` over `any` when type is genuinely uncertain, then narrow with guards.
- API request/response bodies must have explicit types — never infer from raw `req.json()`.

---

## 8. File & Folder Conventions

```
src/
  app/
    [lang]/          # i18n root layout
    api/             # Route Handlers
  components/
    ui/              # shadcn primitives (do not hand-edit)
    [feature]/       # Feature-specific components
  lib/               # Shared utilities (geo.ts, auth.ts, etc.)
  hooks/             # Custom React hooks
  types/             # Shared TypeScript types
prisma/
  schema.prisma
docs/
  context/           # CDD context files (read before coding)
  wireframes/        # Hand-drawn wireframes (check before building UI)
  openapi.yaml       # REST API spec
  schema.dbml        # DB visual spec
```

---

## 9. Auth Rules

- JWT is verified server-side on every protected route via cookie parsing — never trust client-supplied user data.
- `GET /api/auth/me` is the single source of truth for the current session.
- Protect write mutations by checking `ownerId === currentUser.id` or `role === "ADMIN"`.
- Never expose `passwordHash` in any API response.

---

## 10. Geo & Map Rules

- **Server-side bounding box first** (Prisma indexed query), then **Node.js Haversine filter** — never do coordinate math on the client.
- Default search radius: **3.0 km**.
- Always `ssr: false` on Leaflet imports.
- Map pin picker on listing creation writes `latitude` + `longitude` to form state.

---

## 11. Responsive Layout (Mandatory)

**Both mobile and desktop views must be designed thoughtfully for every UI component.** Shipping a component that only works on one breakpoint is not done.

| Breakpoint | Navigation | Layout |
| :--- | :--- | :--- |
| `< 768px` (mobile) | Fixed bottom tab bar (Feed, Search, Post [+], Profile) | Single-column, full-width, touch-optimized |
| `≥ 768px` (desktop) | Persistent left sidebar with nav links + user section | Sidebar + content area, grid layouts |

**Rules:**
- Implement both views in **one single responsive component** using Tailwind responsive prefixes (`md:`, `hidden`). Never two separate components.
- Mobile: minimum 44px touch targets, bottom sheet over modal for secondary content, no hover-only states.
- Desktop: hover states expected, grid layouts, filters visible inline.
- Content area must account for bottom nav height on mobile (`pb-16` or equivalent token).

See [`docs/context/07_RESPONSIVE_LAYOUT.md`](docs/context/07_RESPONSIVE_LAYOUT.md) for the full spec and pre-ship checklist.

---

## 12. Git & Version Control Rules

- After completing each phase execution from `docs/PLAN.md`, immediately stage all changed files, create a concise descriptive commit matching Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`), and push changes to GitHub (`git push origin <branch>`).
