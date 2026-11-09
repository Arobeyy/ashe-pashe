# Project Progress: ashepashe (আশেপাশে)

> **Last Updated:** November 4, 2026  
> **Current Status:** Foundation, Authentication, App Shell, Listings API, Home Feed, Search & Filter Page, and Listing Detail Page are complete. Next in queue: Remaining Phase 8 Admin Reports API & Phase 9 (Post a Listing).

---

## 📊 Quick Summary

| Phase | Description | Status |
| :--- | :--- | :--- |
| **Phase 0** | Foundation & Shared Infrastructure | ✅ Completed |
| **Phase 1** | Authentication API | ✅ Completed |
| **Phase 2** | App Shell & Responsive Layout | ✅ Completed |
| **Phase 3** | Authentication UI (Login & Register) | ✅ Completed |
| **Phase 4** | Listings CRUD & Geo-Search API | ✅ Completed |
| **Phase 5** | Feed Page (Home UI) | ✅ Completed |
| **Phase 6** | Search & Filter Page | ✅ Completed |
| **Phase 7** | Listing Detail Page | ✅ Completed |
| **Phase 8** | Comments & Reports API | ✅ Completed |
| **Phase 9** | Post a Listing (Creation Flow) | ⬜ Todo |
| **Phase 10** | Saved Listings | ⬜ Todo |
| **Phase 11** | User Profile | ⬜ Todo |
| **Phase 12** | Admin Panel & Moderation | ⬜ Todo |
| **Phase 13** | Polish, Accessibility & QA | ⬜ Todo |

---

## ✅ Detailed Breakdown of Completed Work

### Phase 0 — Foundation & Shared Infrastructure
* **Database & ORM:** SQLite database initialized via Prisma with models for Users, Listings, Photos, Comments, SavedListings, and Reports.
* **Singleton DB Client:** Hot-reload safe Prisma client (`src/lib/db.ts`).
* **Authentication Helpers:** Token sign and verify utilities via `jose` (`src/lib/auth.ts`).
* **Geo-Engine:** Bounding box calculations and Haversine distance formula (`src/lib/geo.ts`).
* **Type System:** Strict TypeScript contracts for API responses, user sessions, listing cards, and details (`src/types/index.ts`).
* **Route Protection:** Next.js route proxy configured with cookie checks (`proxy.ts`).
* **Seed Data:** Admin user, 3 test users, and 8 realistic Dhaka accommodation listings seeded with precise coordinates (`prisma/seed.ts`).

### Phase 1 — Authentication API
* `POST /api/auth/register`: User creation with password hashing via `bcryptjs`, JWT issuance in `HttpOnly` cookie.
* `POST /api/auth/login`: Credential validation and session cookie generation.
* `POST /api/auth/logout`: Clears session cookie securely.
* `GET /api/auth/me`: Verifies active session and returns safe public profile (never exposes password hash).

### Phase 2 — App Shell & Navigation
* **Responsive Layout (`src/components/layout/AppShell.tsx`):**
  * **Mobile (< 768px):** Fixed bottom tab bar (Feed, Search, Post [+], Profile).
  * **Desktop (≥ 768px):** Persistent left sidebar with navigation links and user account menu.
* **Layout Integration:** Root layout wraps all localized pages inside `AppShell`.
* **Client Session Hook (`src/hooks/useCurrentUser.ts`):** Fetches session status and manages reactive auth states.

### Phase 3 — Authentication UI
* **Login View (`/[lang]/login`):** Email and password form, validation error messages, and `?from=` redirect handling.
* **Register View (`/[lang]/register`):** User registration form with name, email, password, phone, and occupation selection.
* **Action Gate Helper:** Intercepts unauthenticated user actions (e.g., Post, Save) and routes to login with return path.

### Phase 4 — Listings API
* `GET /api/listings`:
  * Fast indexed bounding box query + in-memory Haversine distance filtering.
  * Multi-filters for rent range, listing type, gender preference, tenant type, and availability.
  * Sorting support (newest, price ascending/descending, nearest).
* `POST /api/listings`: Authenticated listing creation with multipart photo upload handling to `public/uploads/`.
* `GET /api/listings/[id]`: Returns full listing details including author, photos, comments count, and save count.
* `PATCH /api/listings/[id]/status`: Owner-only toggle between available and rented/hidden.
* `DELETE /api/listings/[id]`: Owner-only listing deletion with database cascade.

### Phase 5 — Feed Page (Home)
* **Server-Rendered Entry (`src/app/[lang]/page.tsx`):** Fetches initial listings directly via DB helper for fast first paint without waterfall. Defaults to newest nationwide/city-wide listings without an upfront permission prompt (DEC-003 Option A).
* **ListingCard Component (`src/components/feed/ListingCard.tsx`):** DEC-001 Option A implementation — single primary thumbnail with photo count badge (e.g. "1/4") preventing mobile gesture collisions, flat information drawer, share link copier, and save toggle.
* **Responsive Feed Layout (`src/components/feed/FeedContainer.tsx`):** DEC-002 Option B & DEC-003 Option A — infinite scrolling with IntersectionObserver sentinel element, centered loading spinner, clean end note, on-demand "Near Me" chip defaulting to 3 km radius, `pb-20` mobile container padding, type filter chips, and grid/feed view toggles.

### Phase 6 — Search & Filter Page
* **Server-Rendered Search Entry (`src/app/[lang]/search/page.tsx`):** Parses URL parameters, pre-fetches initial search query server-side, and delivers SSR-rendered results.
* **URL-Driven State:** Query string synchronization for `q`, `area`, `lat`, `lng`, `radius`, `minRent`, `maxRent`, `type`, `genderPreference`, `tenantType`, and `sort` for bookmarkable, shareable search URLs without full page reloads.
* **Interactive Leaflet Map (`src/components/search/SearchMap.tsx`):**
  * Dynamic `ssr: false` client import.
  * Draggable center pin with visual radius boundary circle.
  * Map click listener to drop/move center pin.
  * DEC-005 Option A: Custom compact price badge markers (`৳...`) with hover scaling and detail popups.
  * HTML5 Geolocation "Locate Me" button.
* **Filter Controls (`src/components/search/FilterControls.tsx`):**
  * Rent range inputs with quick price bracket presets (< 5k, 5k-10k, 10k-20k, 20k+).
  * Accommodation type, gender preference, and tenant type toggle chips.
  * DEC-006 Option A: Discrete quick-tap radius adjustment chips (1 km, 3 km [Default], 5 km, 10 km) and clear location action.
  * Reset filters action.
* **Responsive Search Experience (`src/components/search/SearchContainer.tsx`):**
  * DEC-003 Option A: Prominent "Near Me" GPS trigger button in search header defaulting to 3 km radius.
  * DEC-004 Option A: Floating "Map / List" switcher pill on mobile (< 768px) with full-screen list scrolling by default.
  * DEC-007 Option A: Side-by-side desktop layout (≥ 768px) with "Show / Hide Map" toggle expanding listing cards to 3 columns.
  * Debounced query execution on inputs and instant fetch on discrete filter clicks.

### Phase 7 — Listing Detail Page
* **Server-Rendered Listing Detail (`src/app/[lang]/listings/[id]/page.tsx`):**
  * Direct DB query via `getListingById` avoiding internal HTTP waterfalls.
  * Streaming dynamic rendering wrapped in Suspense with customized pulse skeleton (`loading.tsx`).
  * Dynamic SEO metadata generation (`generateMetadata`) with localized titles and descriptions.
  * Dedicated 404 page (`not-found.tsx`) matching design system.
* **Photo Carousel & Lightbox (`src/components/listing/ListingGallery.tsx`):**
  * DEC-008 Option A: Responsive Embla Carousel (`Carousel` from shadcn) supporting local `/uploads/` and remote URLs.
  * Photo counter overlay pill (`1 / 5`) and thumbnail strip on desktop/tablet.
  * Fullscreen dialog lightbox with keyboard and click navigation.
* **Accommodation Details & Flat Information (`src/components/listing/ListingDetailsSection.tsx`):**
  * Accommodation type, gender preference, tenant type, and available-from chips.
  * Facilities chip grid with dynamic icons (WiFi, Attached Bath, Generator, Lift, etc.).
  * Collapsible flat information accordion (`Accordion` from shadcn/Base UI) for rooms, washrooms, balconies, and floor level.
* **Interactive Neighborhood Map (`src/components/listing/ListingLocationMap.tsx`):**
  * Dynamic `ssr: false` client import.
  * DEC-009: User choice between Exact Location Pin and Nearby Area Radius (off-centered ~260m circle protecting resident privacy).
  * External link trigger to Google Maps for navigation.
* **Host Card & Contact Drawer (`src/components/listing/OwnerCard.tsx`):**
  * Host avatar, name, occupation, institution, and profile link.
  * DEC-010 Option A: Action-gated contact dialog requiring login; respects host profile visibility setting (`showContactInfo`) with fallback to public comments.
  * Copy-to-clipboard and 1-tap call triggers + safety reminders.
* **Host Controls Panel (`src/components/listing/OwnerControls.tsx`):**
  * Owner and Admin moderation tools: "Mark as Rented", "Mark as Available", "Hide Listing".
  * Listing deletion with destructive confirmation dialog.
* **Action-Gated Bookmarks & Reports (`src/components/listing/ListingDetailContainer.tsx` & `ReportModal.tsx`):**
  * Optimistic bookmark toggle synced with `POST /api/saved`.
  * URL share button with clipboard feedback.
  * Report modal with structured reason options (`SCAM`, `INACCURATE`, `NO_LONGER_AVAILABLE`, etc.) submitting to `POST /api/reports`.
* **Discussions & Comments Thread (`src/components/listing/CommentsSection.tsx`):**
  * Chronological comments feed with author avatars, names, and relative timestamps.
  * Action-gated comment posting via `POST /api/listings/[id]/comments`.
  * DEC-011 Option A: Author, Host (Listing Owner), & Admin comment moderation deletion controls via `DELETE /api/listings/[id]/comments/[commentId]`.
* **Responsive Layout Split:**
  * **Desktop (≥ 768px):** 2-column layout (wide media + details on left, sticky pricing, host card, and actions on right).
  * **Mobile (< 768px):** Touch-friendly single column with a fixed bottom sticky pricing and action bar (`bottom-16` above bottom navigation) with ≥ 44px tap targets.

### Phase 8 — Comments & Reports API
* `POST /api/listings/[id]/comments`: Authenticated comment submission with character limits (max 1000) and author metadata response.
* `GET /api/listings/[id]/comments`: Public retrieval of active comments for a given listing.
* `DELETE /api/listings/[id]/comments/[commentId]`: Authorization guard allowing comment author, listing owner, or platform admin to delete.
* `POST /api/reports`: Authenticated report creation supporting enumerated reasons (`SCAM`, `INACCURATE`, `NO_LONGER_AVAILABLE`, `DUPLICATE`, `INAPPROPRIATE`, `OTHER`) with listing existence validation.
* `GET /api/reports`: Admin-only paginated moderation queue with status filtering (`OPEN`, `RESOLVED`, `DISMISSED`, `ALL`), including reporter, listing thumbnail, and reviewer relations.
* `GET /api/reports/[id]`: Secured detail lookup accessible only by the filing reporter or platform admin.
* `PATCH /api/reports/[id]`: Admin-only moderation action to resolve or dismiss reports, automatically recording reviewer ID and timestamp.

---

## 🚀 Immediate Next Step
* **Phase 9 — Post a Listing:** Build multi-step listing submission flow with Leaflet map pin picker and photo uploads.

