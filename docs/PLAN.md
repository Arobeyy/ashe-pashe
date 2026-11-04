# ashepashe — Implementation Plan

> **Legend**: `⬜ Todo` · `🔄 In Progress` · `✅ Done` · `⏸ Paused` · `❌ Blocked`
>
> Each phase is reviewed before execution begins. Steps are lettered — individual steps can be paused, swapped, or revised mid-phase.

---

## Decisions Log

| Decision | Choice |
| :--- | :--- |
| Photo storage | Local disk writes to `public/uploads/` + `ListingPhoto.imageUrl` stores the `/uploads/filename` path. URL fallback supported — `imageUrl` accepts any string (local path or external URL). |
| DB | SQLite via Prisma, file `prisma/dev.db` |
| Auth | JWT in `HttpOnly` `SameSite=Lax` cookie via `jose` |
| Maps | Leaflet + OpenStreetMap, always `ssr: false` |
| Styling | Design tokens only — no arbitrary Tailwind values |

---

## Phase 0 — Foundation & Shared Infrastructure

> Everything every other phase depends on. No UI.

| Step | Task | Status |
| :--- | :--- | :--- |
| 0-A | Push Prisma schema to SQLite (`prisma db push`) + generate client | ✅ |
| 0-B | `src/lib/db.ts` — singleton Prisma client (hot-reload safe) | ✅ |
| 0-C | `src/lib/auth.ts` — JWT sign/verify, cookie read/write helpers via `jose` | ✅ |
| 0-D | `src/lib/geo.ts` — `getBoundingBox()` + `haversineDistanceKm()` | ✅ |
| 0-E | `src/types/index.ts` — shared types: `UserPublic`, `ListingCard`, `ListingDetail`, `ApiResponse<T>`, enums | ✅ |
| 0-F | `proxy.ts` — Next.js 16 route proxy with JWT cookie guard for write + admin routes | ✅ |
| 0-G | `prisma/seed.ts` — 1 admin + 3 test users + 8 listings with real Dhaka coordinates | ✅ |

---

## Phase 1 — Auth API

> Register, login, logout, and session check via API.

| Step | Task | Status |
| :--- | :--- | :--- |
| 1-A | `POST /api/auth/register` — bcrypt hash, sign JWT, set `HttpOnly` cookie | ✅ |
| 1-B | `POST /api/auth/login` — verify password, sign JWT, set cookie | ✅ |
| 1-C | `POST /api/auth/logout` — clear cookie | ✅ |
| 1-D | `GET /api/auth/me` — verify cookie, return `UserPublic` + `_count`; never expose `passwordHash` | ✅ |

---

## Phase 2 — App Shell & Navigation

> Persistent layout: mobile bottom tab bar ↔ desktop left sidebar. All pages render inside it.

| Step | Task | Status |
| :--- | :--- | :--- |
| 2-A | `src/components/layout/AppShell.tsx` — single responsive component | ✅ |
|     | → Mobile: fixed bottom bar (Feed · Search · Post [+] · Profile) | |
|     | → Desktop: persistent left sidebar (logo, nav links, user section at bottom) | |
|     | → Content: `pb-16 md:pb-0 md:pl-64` offset | |
| 2-B | Wire `AppShell` into `src/app/[lang]/layout.tsx` | ✅ |
| 2-C | `src/hooks/useCurrentUser.ts` (as `.tsx`) — fetches `/api/auth/me`, caches session client-side | ✅ |
| 2-D | Navigation state — active tab highlight, unauthenticated state (show Login, hide Profile) | ✅ |

> ⚠️ **Wireframe check required before starting** → `docs/wireframes/`

---

## Phase 3 — Auth UI

> Login and register pages.

| Step | Task | Status |
| :--- | :--- | :--- |
| 3-A | `/[lang]/login` — email + password form, error states, `?from=` return URL redirect | ✅ |
| 3-B | `/[lang]/register` — name, email, password, phone (optional), occupation select | ✅ |
| 3-C | Action gate — Save / Comment / Post redirect to `/login?from=<current>` when unauthenticated | ✅ |

> ⚠️ **Wireframe check required before starting.**

---

## Phase 4 — Listings API

> Full CRUD + geo search + multi-filter.

| Step | Task | Status |
| :--- | :--- | :--- |
| 4-A | `GET /api/listings` — bounding box + Haversine, multi-filter (rent, type, gender, tenant), sort | ✅ |
| 4-B | `POST /api/listings` — auth required; validate body; create listing + photos (multipart/form-data, writes to `public/uploads/`) | ✅ |
| 4-C | `GET /api/listings/[id]` — full listing with author, photos, comments, save count | ✅ |
| 4-D | `PATCH /api/listings/[id]/status` — owner or admin only; toggle `availabilityStatus` | ✅ |
| 4-E | `DELETE /api/listings/[id]` — owner or admin only; Prisma cascade handles related records | ✅ |

---

## Phase 5 — Feed Page (Home)

> The main listing feed — first thing every user sees.

| Step | Task | Status |
| :--- | :--- | :--- |
| 5-A | `src/app/[lang]/page.tsx` — Server Component; fetch listings (default: `newest`), pass to client grid | ✅ |
| 5-B | `ListingCard` component — photo, title, rent, area, type badge, distance chip (if geo) | ✅ |
|     | → Mobile: full-width stacked card | |
|     | → Desktop: grid card (`grid-cols-2 lg:grid-cols-3`) | |
| 5-C | Feed layout — responsive grid + loading skeletons | ✅ |
| 5-D | "Load more" pagination (or infinite scroll) | ✅ |

> ⚠️ **Wireframe check required before starting.**

---

## Phase 6 — Search & Filter Page

> Location-aware search with all filters on both mobile and desktop.

| Step | Task | Status |
| :--- | :--- | :--- |
| 6-A | `/[lang]/search` page — URL-driven state (all params in query string, shareable links) | ✅ |
| 6-B | Leaflet map pin picker — user drops pin to set search center (`ssr: false`) | ✅ |
| 6-C | Filter controls — rent range, type chips, gender pref, tenant type | ✅ |
|     | → Mobile: bottom sheet (`Sheet` from shadcn) behind a "Filters" button | |
|     | → Desktop: inline sticky filter panel | |
| 6-D | Sort selector — Newest / Nearest / Lowest price / Highest price / Available soonest | ✅ |
| 6-E | Results update on filter change (debounced fetch, no full reload) | ✅ |

> ⚠️ **Wireframe check required before starting.**

---

## Phase 7 — Listing Detail Page

> Full listing view: gallery, all details, comments, owner actions.

| Step | Task | Status |
| :--- | :--- | :--- |
| 7-A | `/[lang]/listings/[id]` — Server Component, fetch full detail | ✅ |
| 7-B | Photo carousel — `Carousel` from shadcn, supports both local `/uploads/` paths and URLs | ✅ |
| 7-C | Detail section — rent, bills, type, gender pref, tenant type, facilities chips, flat info (collapsible) | ✅ |
| 7-D | Owner card — avatar, name, occupation, link to profile | ✅ |
| 7-E | Save button — toggle bookmark, optimistic UI, action-gated | ✅ |
| 7-F | Report button — dialog with reason select + optional details | ✅ |
| 7-G | Owner controls — Mark as Rented / Hide buttons (`PATCH /api/listings/[id]/status`) | ✅ |
| 7-H | Comments section — list + add form (action-gated) | ✅ |

> ⚠️ **Wireframe check required before starting.**

---

## Phase 8 — Comments & Reports API

> Backend for comments and report filing.

| Step | Task | Status |
| :--- | :--- | :--- |
| 8-A | `POST /api/listings/[id]/comments` — auth required | ✅ |
| 8-B | `DELETE /api/listings/[id]/comments/[commentId]` — author or admin | ✅ |
| 8-C | `POST /api/reports` — auth required | ✅ |
| 8-D | `GET /api/reports` — admin only, paginated, filtered by `status` | ⬜ |
| 8-E | `PATCH /api/reports/[id]` — admin only; resolve or dismiss | ⬜ |

---

## Phase 9 — Post a Listing

> Full listing creation flow: form, map pin picker, photo upload.

| Step | Task | Status |
| :--- | :--- | :--- |
| 9-A | `/[lang]/post` page — auth-gated, multi-step or single-scroll | ⬜ |
| 9-B | Step 1: Basic info — title, description, type, rent, bills | ⬜ |
| 9-C | Step 2: Location — Leaflet map pin picker, area + address fields | ⬜ |
| 9-D | Step 3: Details — gender pref, tenant type, facilities chip multi-select, flat info | ⬜ |
| 9-E | Step 4: Photos — multi-file upload, preview, reorder, remove; `POST /api/upload` writes to `public/uploads/` | ⬜ |
| 9-F | Step 5: Review + Submit — preview card, available-from date picker, submit | ⬜ |
| 9-G | On success — redirect to new listing detail page | ⬜ |

> ⚠️ **Wireframe check required before starting.**

---

## Phase 10 — Saved Listings

> Bookmark toggle + saved listings page.

| Step | Task | Status |
| :--- | :--- | :--- |
| 10-A | `POST /api/saved` — toggle save/unsave, return new saved state | ⬜ |
| 10-B | `GET /api/saved` — auth required; return all saved listings | ⬜ |
| 10-C | `/[lang]/saved` page — grid of saved cards, empty state | ⬜ |

---

## Phase 11 — User Profile

> Public profile page + own profile editor.

| Step | Task | Status |
| :--- | :--- | :--- |
| 11-A | `/[lang]/profile/[id]` — avatar, cover banner, name, occupation, bio, interests, listing grid | ⬜ |
| 11-B | `/[lang]/profile/edit` — own profile form: all fields, avatar upload, cover upload, interests multi-select | ⬜ |
| 11-C | `GET /api/users/[id]` — public profile endpoint | ⬜ |
| 11-D | `PATCH /api/users/[id]` — own profile only, ownership check | ⬜ |

> ⚠️ **Wireframe check required before starting.**

---

## Phase 12 — Admin Panel

> Moderation tools: report queue + listing status management.

| Step | Task | Status |
| :--- | :--- | :--- |
| 12-A | `/[lang]/admin` — admin-only route (middleware guard) | ⬜ |
| 12-B | Reports queue — paginated `OPEN` reports, listing preview, one-click Resolve/Dismiss | ⬜ |
| 12-C | Listing moderation table — toggle `moderationStatus` per listing | ⬜ |
| 12-D | `PATCH /api/admin/listings/[id]/moderation` — admin only | ⬜ |

---

## Phase 13 — Polish & QA

> Performance, accessibility, edge cases, final checks.

| Step | Task | Status |
| :--- | :--- | :--- |
| 13-A | Loading skeletons — feed, detail page, profile | ⬜ |
| 13-B | Empty states — no search results, no saved listings, no profile listings | ⬜ |
| 13-C | Error pages — 404 and 500 matching design system | ⬜ |
| 13-D | SEO — `generateMetadata` on listing detail and profile pages | ⬜ |
| 13-E | Responsive QA — verify every page at 375px and 1280px (checklist in `07_RESPONSIVE_LAYOUT.md`) | ⬜ |
| 13-F | Token audit — `grep -r 'bg-\[' src/` must return nothing | ⬜ |
| 13-G | TypeScript strict pass — `npx tsc --noEmit` exits clean | ⬜ |
| 13-H | Seed verification — run `prisma db seed`, confirm listings appear on feed | ⬜ |

---

## Phase Dependency Map

```
Phase 0 (Foundation)
  └── Phase 1 (Auth API)
        ├── Phase 2 (App Shell)
        │     └── Phase 3 (Auth UI)
        │           ├── Phase 5 (Feed)             needs Phase 4
        │           ├── Phase 6 (Search)            needs Phase 4
        │           ├── Phase 7 (Listing Detail)    needs Phase 4 + 8
        │           ├── Phase 9 (Post Listing)      needs Phase 4
        │           ├── Phase 10 (Saved)            needs Phase 4
        │           └── Phase 11 (Profile)
        └── Phase 4 (Listings API)
Phase 12 (Admin) needs Phase 8
Phase 13 (Polish) runs last over everything
```

