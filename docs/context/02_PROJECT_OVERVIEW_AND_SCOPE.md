# Project Overview & Scope — ashepashe (আশেপাশে)

## Product Vision

**Student & Community Accommodation Platform** (`ashepashe` / `আশেপাশে`)

A lightweight, mobile-first, hyper-local discovery platform that connects students, job holders, and working bachelors with accommodation seekers and listers using radius-based proximity search, transparent flat details, and community trust features.

**Primary target areas**: Mirpur, Dhanmondi, Bashundhara, University of Dhaka area (and adjacent university hubs in Dhaka, Bangladesh).

---

## User Roles & Permission Matrix

| Role | Description & Permissions |
| :--- | :--- |
| **Unauthenticated Visitor** | Browse feed, search by radius/location, apply filters/sorting, view listing details, view public profiles. Cannot comment, save, post, or report. |
| **Unified User (Seeker & Lister)** | Authenticated member. Can create listings, upload photos, comment, save/bookmark, edit/delete own listings, report suspicious posts. Switches freely between seeking and listing. |
| **Admin** | Moderates content. Can review reports, hide/delete listings, toggle moderation status, suspend accounts. |
| **Business Owner** | ⛔ Out of scope for MVP Release 1. Reserved for future releases (mess catering, laundromats, libraries, etc.). |

---

## Access Control Rules

1. **Public Reading** — Listings and profiles are viewable without login.
2. **Action Gate** — Clicking "Comment", "Save", "Post Listing", or "Report" redirects unauthenticated users to `/login` with a return URL.
3. **Owner-Only Mutations** — Users can only edit/delete their own listings (`ownerId === currentUser.id`) and comments (`authorId === currentUser.id`).
4. **Admin Overrides** — `role === "ADMIN"` can hide/delete any listing or comment and review report queues.

---

## MVP Scope (Release 1)

### In Scope
- Accommodation listings (Seat, Room, Flat)
- Radius-based geo search with map picker
- Multi-filter: rent range, type, gender preference, tenant type
- Photo uploads per listing
- Comments on listings
- Save/bookmark listings
- Report/flag listings
- User profiles (avatar, bio, occupation, interests)
- JWT auth (register, login, logout)
- Admin moderation queue
- Mobile bottom nav + Desktop top nav
- Bilingual support (English + Bengali)

### Out of Scope (Reserved for Future Releases)
- Business Owner profiles & landing
- Messaging / chat between users
- Verified/trusted badge system
- Payment or subscription features
- Push notifications

