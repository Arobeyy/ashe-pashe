# API Contract — ashepashe

**Style**: REST. All routes under `src/app/api/`. Full spec: `docs/openapi.yaml`.
**Auth**: JWT signed with `JWT_SECRET`, stored in `HttpOnly`, `SameSite=Lax` cookies.

---

## Auth Endpoints (`/api/auth`)

| Method | Route | Auth | Body / Notes |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | — | `{ name, email, password, phone?, occupation?, education? }` → sets `token` cookie |
| `POST` | `/api/auth/login` | — | `{ email, password }` → sets `token` cookie |
| `POST` | `/api/auth/logout` | — | Clears `token` cookie |
| `GET` | `/api/auth/me` | Cookie | Returns current user + `_count: { listings, savedListings, comments }` |

---

## Listings Endpoints (`/api/listings`)

| Method | Route | Auth | Notes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/listings` | — | Multi-filter + geo search. See [Geo Engine](./04_GEO_ENGINE.md) for params. |
| `POST` | `/api/listings` | Required | Full listing JSON payload + photos array |
| `GET` | `/api/listings/[id]` | — | Single listing with author, photos, comments, save count |
| `PATCH` | `/api/listings/[id]/status` | Owner or Admin | `{ availabilityStatus: "AVAILABLE" \| "RENTED" \| "HIDDEN" }` |
| `DELETE` | `/api/listings/[id]` | Owner or Admin | Cascade deletes photos, comments, saves, reports |

---

## Comments (`/api/listings/[id]/comments`)

| Method | Route | Auth | Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/listings/[id]/comments` | Required | `{ content }` |
| `DELETE` | `/api/listings/[id]/comments/[commentId]` | Owner or Admin | — |

---

## Reports (`/api/reports`)

| Method | Route | Auth | Notes |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/reports` | Required | `{ listingId, reason, details? }` |
| `GET` | `/api/reports` | Admin only | Paginated list of pending/open reports |
| `PATCH` | `/api/reports/[id]` | Admin only | `{ status: "RESOLVED" \| "DISMISSED" }` |

**Report reason enum**: `SCAM` | `INACCURATE` | `NO_LONGER_AVAILABLE` | `DUPLICATE` | `INAPPROPRIATE` | `OTHER`

---

## Saved Listings (`/api/saved`)

| Method | Route | Auth | Notes |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/saved` | Required | `{ listingId }` — toggles save/unsave |
| `GET` | `/api/saved` | Required | Returns all saved listings for current user |

---

## Authorization Rules

- **Owner-Only**: Mutations on a listing or comment check `ownerId === currentUser.id` (or `authorId`).
- **Admin Override**: `role === "ADMIN"` bypasses owner checks for deletions and moderation.
- **Unauthenticated**: Write actions return `401` with `{ redirect: "/login?from=<returnUrl>" }`.

