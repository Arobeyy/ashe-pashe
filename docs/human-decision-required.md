# Human Decisions Required

This document tracks design, UX, and architectural decisions requiring user/stakeholder review before or during implementation.

> **Status Tags:**  
> ` 🟡 Pending Review` — Decision is open and awaiting user choice.  
> ` | ✅ | Decided` — Option chosen and confirmed.  
> ` ⚪ Deferred` — Postponed to a future phase.

---

## 🟡 Pending Decisions (Immediate: Phase 5 & 6)

### DEC-001: Listing Card Photo Presentation on Feed
* **Phase:** Phase 5 (Feed Page)
* **Wireframe Reference:** [`docs/wireframes/post design on feed.jpeg`](file:///home/arobey/ashe-pashe/docs/wireframes/post%20design%20on%20feed.jpeg)
* **Context:** When users browse listings on the home feed, how should multiple photos be presented on each card?
* **Options:**
  * **Option A (Recommended & Chosen): Single primary thumbnail with photo count badge** (e.g., "1/4"). Fast rendering, clean touch targets, clicking navigates to full listing.
  * **Option B: Inline mini-carousel** (swipeable images directly on the feed card). Gives instant photo preview without opening the listing, but increases DOM size and can conflict with mobile vertical scrolling.
* **Status:** `✅ Decided`
* **Choice:** Option A (Single primary thumbnail with photo count badge, e.g., "1/4")
* **Rationale:**
  1. Prevents horizontal gesture conflicts with vertical scrolling on mobile touchscreens.
  2. Exactly matches our hand-drawn feed card wireframe layout.
  3. Minimizes DOM nodes, memory footprint, and network requests on mobile devices.
  4. The full multi-photo interactive carousel is reserved for the listing detail page (`Phase 7`).

---

### DEC-002: Feed Pagination Strategy
* **Phase:** Phase 5 (Feed Page)
* **Context:** How should additional listings be loaded when scrolling down the main feed?
* **Options:**
  * **Option A: "Load More" button.** Provides predictable user control, works reliably on mobile, and allows users to reach footer or bottom navigation without infinite loading traps.
  * **Option B (Chosen): Infinite scroll with an end-of-results state.** Automatically loads next pages using an IntersectionObserver sentinel element at the bottom of the feed with a small centered spinner during fetch and a clean end note when complete. Feed container has `pb-20` on mobile.
* **Status:** `✅ Decided`
* **Choice:** Option B (Infinite scroll with end-of-results state)
* **Rationale:** Seamless modern browsing experience on feed with explicit sentinel observer, spinner indicator during page fetch, clean completion notice ("You've reached the end — showing all available listings within your active radius"), and `pb-20` spacing guarding mobile bottom navigation.

---

### DEC-003: Default Feed Sorting & Geolocation Prompt
* **Phase:** Phase 5 (Feed Page) & Phase 6 (Search)
* **Context:** When a visitor lands on the homepage for the first time, what should they see by default?
* **Options:**
  * **Option A (Recommended & Implemented): Default to "Newest Listings" nationwide/city-wide without an immediate browser permission prompt.** A visible "Near Me" chip or button allows them to trigger GPS location when desired. When location is granted, default to a 3 km radius around coordinates.
  * **Option B: Prompt for GPS location immediately on load** to sort by nearest within 3 km. If denied, fall back to newest. (May lead to permission bounce rate).
* **Status:** `✅ Decided`
* **Choice:** Option A (Default to "Newest Listings" with on-demand "Near Me" trigger button defaulting to 3 km radius)
* **Rationale:** Prevents permission-prompt bounce and respects browser privacy on first load. Provide a prominent "Near Me" chip or trigger button in the search/filter header so users can activate GPS discovery on demand. When location is granted, default to a 3 km radius around the user's coordinates.

---

### DEC-004: Mobile Search Experience (Map vs. List)
* **Phase:** Phase 6 (Search & Filter)
* **Context:** How should the Leaflet map and listing cards coexist on mobile screens (< 768px)?
* **Options:**
  * **Option A (Recommended & Implemented): View Toggle Button (Floating "Map / List" switcher).** Fullscreen list view by default, tapping the floating pill switches seamlessly to full map view with pin popups. Desktop uses side-by-side split view.
  * **Option B: Split view on mobile.** Half screen map on top, scrollable cards on bottom. (Can feel cramped on smaller phone screens).
* **Status:** `✅ Decided`
* **Choice:** Option A (View Toggle Button — Floating "Map / List" switcher)
* **Rationale:** On mobile screens (< 768px), half-and-half split view leaves too little room for listing details and makes map interactions cramped. A floating toggle pill allows full-screen list scrolling by default and instant switching to a full Leaflet map view with pin popups. Keep side-by-side split layout for desktop (≥ 768px).

---

### DEC-005: Map Marker Presentation on Search Map
* **Phase:** Phase 6 (Search & Filter)
* **Context:** How should accommodation listings be displayed on the Leaflet map?
* **Options:**
  * **Option A (Recommended & Implemented): Compact Price Badges** (e.g., "৳5,000" pill), scaling and highlighting when the listing card is hovered, expanding into a rich preview popup upon click (Airbnb style).
  * **Option B: Classic Map Pin Markers** (standard colored map pin icons) with popups.
* **Status:** `✅ Decided`
* **Choice:** Option A (Compact Price Badges, e.g., "৳3,500" pill)
* **Rationale:** Airbnb-style price pills show monthly rent directly on the map surface, which is far more useful for comparing accommodations than generic pins. When a user hovers a listing card, highlight the corresponding badge; when clicked, open a compact listing preview modal/card.

---

### DEC-006: Search Radius Adjustment Control
* **Phase:** Phase 6 (Search & Filter)
* **Context:** When a user sets a center pin, how should they adjust the search radius (e.g., 1 km, 3 km, 5 km, 10 km)?
* **Options:**
  * **Option A (Recommended & Implemented): Discrete Quick-Tap Radius Chips (1 km, 3 km [Default], 5 km, 10 km).** Optimized for touch devices and rapid filter changes with minimal friction.
  * **Option B: Continuous Range Slider (0.5 km to 15 km)** with real-time numeric value display.
* **Status:** `✅ Decided`
* **Choice:** Option A (Discrete Quick-Tap Radius Chips: 1 km, 3 km [Default], 5 km, 10 km)
* **Rationale:** Discrete chips provide immediate, single-tap adjustments with clear targets for mobile touch. Sliders are harder to adjust accurately on phones and cause excessive re-querying during drag gestures.

---

### DEC-007: Desktop Map Display Preference
* **Phase:** Phase 6 (Search & Filter)
* **Context:** How should desktop users interact with the map alongside the listing feed?
* **Options:**
  * **Option A (Recommended & Implemented): Side-by-Side Split with "Show / Hide Map" Toggle.** Filter sidebar on left, listings in center, sticky interactive map on the right, with a quick toggle to collapse the map for a wider 3-column feed.
  * **Option B: Fixed Side-by-Side (Always Visible).** Map is permanently visible on screens ≥ 1024px without a hide toggle.
* **Status:** `✅ Decided`
* **Choice:** Option A (Side-by-Side Split with "Show / Hide Map" Toggle)
* **Rationale:** Provides the best of both worlds: an interactive split-screen map on desktop by default, with a toggle allowing users who prefer browsing a wider multi-column feed of cards to collapse the map view.

---

### DEC-008: Listing Detail Photo Presentation on Desktop
* **Phase:** Phase 7 (Listing Detail Page)
* **Context:** How should accommodation photos be arranged on larger screens (desktop/tablet)?
* **Options:**
  * **Option A (Recommended & Implemented): Full-Width Main Carousel with Horizontal Thumbnail Strip.** Guarantees consistent high visual quality regardless of whether a student uploads 1 photo or 8 photos. Includes a fullscreen lightbox dialog for in-depth viewing.
  * **Option B: Airbnb-Style Multi-Grid (1 large photo + 4 small grid photos).** Requires at least 5 photos to render without empty gaps or asymmetrical layout jumps.
* **Status:** `✅ Decided`
* **Choice:** Option A (Full-Width Main Carousel with Horizontal Thumbnail Strip)
* **Rationale:** Guarantees consistent high visual quality regardless of whether a student uploads 1 photo or 8 photos. Includes a fullscreen lightbox dialog for in-depth viewing.

---

### DEC-009: Listing Location Privacy & Pin Precision
* **Phase:** Phase 7 (Listing Detail Page)
* **Context:** For safety and privacy of students and female-only accommodations, how exact should the public Leaflet map coordinates be on the detail page?
* **Options:**
  * **Option A: Neighborhood Area Radius Circle with disclaimer note.** Shows general vicinity, nearby universities, and transit without exposing the exact residential floor/rooftop until the student contacts the host.
  * **Option B: Exact Pinpoint Pin.** Places a pin directly on exact coordinates.
* **Status:** `✅ Decided`
* **Choice:** Both Options Supported (User Choice: Exact Pin + Nearby Area Radius with Off-Centered Circle)
* **Rationale:** Keep both options for the user to choose from. For exact location, use a pinpoint pin marker. For nearby area radius, use an off-centered circle (~260m) as visual reference for the user without revealing exact coordinates, providing neighborhood context while safeguarding resident privacy.

---

### DEC-010: Host Contact Details Access Strategy
* **Phase:** Phase 7 (Listing Detail Page)
* **Context:** How should seekers connect with hosts?
* **Options:**
  * **Option A: Action-Gated Contact Modal with Phone Copy + Call Trigger.** Requires users to be signed in to view the host's direct phone number, protecting numbers from web scrapers and unauthorized callers while displaying fraud safety reminders.
  * **Option B: Plain Unprotected Phone Number directly in page text.** Accessible to unauthenticated scrapers without safety prompts.
* **Status:** `✅ Decided`
* **Choice:** Option A (Action-Gated Contact Modal with User Profile Visibility Control)
* **Rationale:** Users must log in to view host contact information, protecting against scrapers and displaying fraud safety reminders. Hosts can choose whether to display their contact information in their profile/listings; if and only if the host chooses to show it, other users can log in to view it. When disabled, users communicate via listing comments.

---

### DEC-011: Public Listing Questions / Comments Moderation Policy
* **Phase:** Phase 7 (Listing Detail Page)
* **Context:** Who can delete or hide public questions asked on accommodation listings?
* **Options:**
  * **Option A (Recommended & Implemented): Author can delete their own comment; Host (Listing Owner) & Admin can moderate/delete any comment on their listing.** Encourages transparency while giving hosts control against spam or trolling.
  * **Option B: Only Admin can delete comments.** Reduces host control over their listing thread.
* **Status:** `✅ Decided`
* **Choice:** Option A (Author can delete own comment; Host & Admin can moderate/delete any comment on their listing)
* **Rationale:** Preserves author rights while giving hosts and admins essential moderation authority over discussions on their property.

---

## 🟢 Previously Decided

| ID | Topic | Decision | Date |
| :--- | :--- | :--- | :--- |
| **DEC-000** | Photo Storage Strategy | Local disk writes to `public/uploads/` with URL string storage in DB. | Phase 0 |
| **DEC-000b** | Database Engine | SQLite via Prisma (`prisma/dev.db`). | Phase 0 |
| **DEC-000c** | Map Library | Leaflet + OpenStreetMap with `ssr: false`. | Phase 0 |

