# Student Accommodation Platform (ashepashe / আশেপাশে) — Context-Driven Development (CDD) Specification Suite

This document serves as the authoritative, end-to-end Context-Driven Development (CDD) suite for the **Student & Community Accommodation Platform** (`ashepashe` / `আশেপাশে`). It contains the complete technical architecture, database schemas, mathematical geo-search algorithms, wireframe-accurate UI component code, and API contracts necessary to feed AI coding agents (Google Antigravity, Cursor, Claude Code) for autonomous, zero-hallucination implementation.

---

# Index of Modular Context Files

To maximize context-window efficiency when prompting AI agents, this suite is organized into **6 self-contained Markdown files**. You can feed these files individually to your AI coding agents based on the module they are currently building, or use this entire file as the project's master context repository.

| File Name | Purpose & Primary Target Subagent |
| :--- | :--- |
| **`01_MASTER_AGENTS_INSTRUCTIONS.md`** | Core architectural rules, tech stack constraints, directory structure, and bootstrap prompts for AI IDEs (`AGENTS.md` / `README.md`). |
| **`02_PROJECT_OVERVIEW_AND_SCOPE.md`** | Product vision, user roles (Seeker, Lister, Admin, Business Owner), permission boundaries, and MVP scope guards. |
| **`03_DATABASE_SCHEMA_AND_MODELS.md`** | Complete `prisma/schema.prisma` for SQLite, matching `docs/schema.dbml` for dbdiagram.io, indexes, and seed configuration. |
| **`04_GEO_ENGINE_AND_RADIUS_SEARCH_SPEC.md`** | Bounding box + Haversine distance engine (`src/lib/geo.ts`), Leaflet interactive map picker, and location search route logic. |
| **`05_API_CONTRACT_AND_BUSINESS_LOGIC.md`** | REST API specs (OpenAPI 3.0), JWT HttpOnly auth flow, multi-filter interoperability matrix, and admin moderation queue. |

---

## File 1: `01_MASTER_AGENTS_INSTRUCTIONS.md`

### Purpose & Overview
This file defines the system guardrails, repository file tree, dependency stack, and setup execution steps for AI coding agents. Save this file as `AGENTS.md` or `README.md` in your project root.

### 1. Locked Technology Stack

- **Framework**: Next.js 15 (App Router, React 19 / TypeScript strict mode). Unified full-stack monolith (API routes in `src/app/api/` and UI pages in `src/app/`). Single process on port 3000, zero CORS friction.
- **Database & ORM**: SQLite (`prisma/dev.db`) + Prisma ORM. Zero local daemon RAM/CPU overhead.
- **Styling & CSS**: Tailwind CSS v4 with modern CSS variable configuration.
- **Component Primitives**: `shadcn/ui` (custom clean theme built on Radix UI) + `lucide-react` icons.
- **Maps & Geolocation**: Leaflet + OpenStreetMap (`react-leaflet` / `leaflet`) loaded dynamically with `ssr: false`. Zero API keys or credit card requirements.
- **Authentication**: JWT signed via `jose` or `jsonwebtoken` + `bcryptjs`, stored in secure, `HttpOnly`, `SameSite=Lax` cookies.
- **Documentation Artifacts**: OpenAPI 3.0 (`docs/openapi.yaml`) and DBML (`docs/schema.dbml`).


### Agent Execution Rules
1. **Zero Client-Side Filtering for Coordinates**: Always calculate coarse bounding box coordinates on the server using Prisma indexed queries before running in-memory Haversine distance filtering in Node.js.
2. **Responsive Dual-Nav Standard**:
   - Mobile (< 768px): Fixed bottom 4-tab bar (`Feed`, `Search`, `Post [+]`, `Profile`).
   - Desktop ($\ge 768\text{px}$): Top header navigation bar with user dropdown and post button.
3. **No Heavy Background Daemons**: Do not introduce PostgreSQL, Docker containers, or SpatiaLite C-extensions. Keep database execution bound strictly to `prisma/dev.db`.
4. **Interactive Maps**: Always dynamically import Leaflet components with `ssr: false` to prevent Next.js SSR hydration mismatches (`window is not defined`).

---

## File 2: `02_PROJECT_OVERVIEW_AND_SCOPE.md`

### Purpose & Scope Guard
This document defines the product vision, domain concepts, target users, access permissions, and MVP release boundaries for `ashepashe` (`আশেপাশে`).

### 1. Product Vision & Target Audience
- **Name**: Student & Community Accommodation Platform (`ashepashe` / `আশেপাশে`).
- **Target Audience**: Students, university applicants, job holders, working bachelors, and families seeking or renting out single rooms, shared seats, or entire flats in university hubs (e.g., Mirpur, Dhanmondi, Bashundhara, University of Dhaka area).
- **Core Value Proposition**: A lightweight, mobile-first, hyper-local discovery platform that connects seekers directly with listers using radius-based proximity search, transparent flat details, and community trust features.

### 2. User Roles & Permission Matrix

| Role / Actor | Description & Permissions |
| :--- | :--- |
| **Unauthenticated Visitor** | Can browse feed listings, search by radius/location, apply filters/sorting, view full listing details, and view public user profiles. **Cannot** comment, save listings, post listings, or file reports. |
| **Unified User (Seeker & Lister)** | Authenticated student/member. Can switch seamlessly between seeking and listing. Allowed to create accommodation posts, upload photos, comment on listings, save/bookmark posts, edit/delete their own listings, and report suspicious posts. |
| **Admin** | Moderates platform content. Can review filed reports, hide/delete inappropriate listings, toggle listing moderation status (`APPROVED`, `PENDING`, `FLAGGED`, `REJECTED`), and suspend accounts. |
| **Business Owner / Profile** | *Scope Guard*: Out of scope for MVP Release 1. Reserved for local businesses (mess catering, laundromats, libraries). Designed to have a separate landing/login workflow in future releases. |

### 3. Access Control & Authorization Rules
1. **Public Reading**: Visitors can view listings and profiles without login prompts.
2. **Action Gate**: Clicking "Comment", "Save/Bookmark", "Post Listing", or "Report" redirects unauthenticated visitors to `/login` with a return URL redirect.
3. **Owner-Only Mutations**: A user can edit or delete *only* listings and comments where `ownerId === currentUser.id` or `authorId === currentUser.id`.
4. **Admin Overrides**: Users with `role === "ADMIN"` can hide or delete any listing or comment, and review filed report queues.

---

## File 3: `03_DATABASE_SCHEMA_AND_MODELS.md`

### Purpose & Implementation Details
This document contains the finalized SQLite relational database model. It contains the complete `prisma/schema.prisma` file, the visual DBML specification for [dbdiagram.io](https://dbdiagram.io), explicit indexing rules, and seed script instructions.

### 1. Final `prisma/schema.prisma`
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  phone        String?
  avatarUrl    String?
  coverUrl     String?  // Banner background photo

  // Profile Details
  occupation   String?  @default("Student") // "Student", "Job Holder", "Landlord", etc.
  education    String?  // e.g. "University of Dhaka" or "College / Degree"
  location     String?  // e.g. "Mirpur, Dhaka"
  bio          String?
  interests    String   @default("[]") // Serialized JSON array: ["CSE", "Photography", "Football"]

  role         String   @default("USER") // "USER" | "ADMIN"
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  listings        AccommodationListing[]
  comments        Comment[]
  savedListings   SavedListing[]
  filedReports    Report[]               @relation("UserFiledReports")
  reviewedReports Report[]               @relation("AdminReviewedReports")

  @@map("users")
}

model AccommodationListing {
  id            String   @id @default(cuid())
  ownerId       String
  title         String
  description   String
  monthlyRent   Int
  billsIncluded Boolean  @default(false)

  // Geographic Location
  area          String
  address       String
  latitude      Float
  longitude     Float

  // Tenancy Classifications
  accommodationType String // "SEAT" | "ROOM" | "FLAT"
  genderPreference  String @default("ANY") // "MALE" | "FEMALE" | "ANY"
  tenantType        String @default("BACHELOR") // "BACHELOR" | "FAMILY" | "ANY"

  // Facilities Chips (Serialized JSON array)
  facilities        String @default("[]") // e.g. '["wifi", "kitchen", "attached bath"]'

  // Flat Information (Collapsible in UI, applicable to all accommodation types)
  totalRooms     Int?
  totalWashrooms Int?
  balconies      Int?
  floorLevel     Int?

  // Status & Lifecycle
  availableFrom      DateTime
  availabilityStatus String    @default("AVAILABLE") // "AVAILABLE" | "UNAVAILABLE" | "RENTED" | "HIDDEN"
  moderationStatus   String    @default("APPROVED")  // "APPROVED" | "PENDING" | "FLAGGED" | "REJECTED"
  expiresAt          DateTime?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  // Relationships
  owner        User           @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  photos       ListingPhoto[]
  comments     Comment[]
  savedByUsers SavedListing[]
  reports      Report[]

  @@index([ownerId])
  @@index([area])
  @@index([monthlyRent])
  @@index([genderPreference])
  @@index([tenantType])
  @@index([availabilityStatus])
  @@index([latitude, longitude])
  @@map("accommodation_listings")
}

model ListingPhoto {
  id           String   @id @default(cuid())
  listingId    String
  imageUrl     String
  displayOrder Int      @default(0)
  createdAt    DateTime @default(now())

  listing AccommodationListing @relation(fields: [listingId], references: [id], onDelete: Cascade)

  @@index([listingId])
  @@map("listing_photos")
}

model Comment {
  id        String   @id @default(cuid())
  listingId String
  authorId  String
  content   String
  isHidden  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  listing AccommodationListing @relation(fields: [listingId], references: [id], onDelete: Cascade)
  author  User                 @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@index([listingId])
  @@index([authorId])
  @@map("comments")
}

model SavedListing {
  id        String   @id @default(cuid())
  userId    String
  listingId String
  createdAt DateTime @default(now())

  user    User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  listing AccommodationListing @relation(fields: [listingId], references: [id], onDelete: Cascade)

  @@unique([userId, listingId])
  @@map("saved_listings")
}

model Report {
  id           String    @id @default(cuid())
  reporterId   String
  listingId    String
  reason       String    // "SCAM" | "INACCURATE" | "NO_LONGER_AVAILABLE" | "DUPLICATE" | "INAPPROPRIATE" | "OTHER"
  details      String?
  status       String    @default("OPEN") // "OPEN" | "RESOLVED" | "DISMISSED"
  reviewedById String?
  reviewedAt   DateTime?
  createdAt    DateTime  @default(now())

  reporter   User                 @relation("UserFiledReports", fields: [reporterId], references: [id], onDelete: Cascade)
  listing    AccommodationListing @relation(fields: [listingId], references: [id], onDelete: Cascade)
  reviewedBy User?                @relation("AdminReviewedReports", fields: [reviewedById], references: [id], onDelete: SetNull)

  @@index([reporterId])
  @@index([listingId])
  @@index([status])
  @@map("reports")
}
```

### 2. Matching DBML Specification (`docs/schema.dbml`)
```dbml
Enum UserRole { USER ADMIN }
Enum AccommodationType { SEAT ROOM FLAT }
Enum GenderPreference { MALE FEMALE ANY }
Enum TenantType { BACHELOR FAMILY ANY }
Enum AvailabilityStatus { AVAILABLE UNAVAILABLE RENTED HIDDEN }
Enum ModerationStatus { APPROVED PENDING FLAGGED REJECTED }
Enum ReportReason { SCAM INACCURATE NO_LONGER_AVAILABLE DUPLICATE INAPPROPRIATE OTHER }
Enum ReportStatus { OPEN RESOLVED DISMISSED }

Table users {
  id varchar [pk]
  name varchar [not null]
  email varchar [not null, unique]
  password_hash varchar [not null]
  phone varchar
  avatar_url varchar
  cover_url varchar
  occupation varchar [default: 'Student']
  education varchar
  location varchar
  bio text
  interests text [default: '[]']
  role UserRole [not null, default: 'USER']
  created_at datetime [not null, default: `now()`]
  updated_at datetime [not null]
}

Table accommodation_listings {
  id varchar [pk]
  owner_id varchar [not null]
  title varchar [not null]
  description text [not null]
  monthly_rent int [not null]
  bills_included boolean [not null, default: false]
  area varchar [not null]
  address varchar [not null]
  latitude float [not null]
  longitude float [not null]
  accommodation_type AccommodationType [not null]
  gender_preference GenderPreference [not null, default: 'ANY']
  tenant_type TenantType [not null, default: 'BACHELOR']
  facilities text [not null, default: '[]']
  total_rooms int
  total_washrooms int
  balconies int
  floor_level int
  available_from date [not null]
  availability_status AvailabilityStatus [not null, default: 'AVAILABLE']
  moderation_status ModerationStatus [not null, default: 'APPROVED']
  expires_at datetime
  created_at datetime [not null, default: `now()`]
  updated_at datetime [not null]

  indexes {
    owner_id
    area
    monthly_rent
    gender_preference
    tenant_type
    availability_status
    (latitude, longitude)
  }
}

Table listing_photos {
  id varchar [pk]
  listing_id varchar [not null]
  image_url varchar [not null]
  display_order int [not null, default: 0]
  created_at datetime [not null, default: `now()`]

  indexes { listing_id }
}

Table comments {
  id varchar [pk]
  listing_id varchar [not null]
  author_id varchar [not null]
  content text [not null]
  is_hidden boolean [not null, default: false]
  created_at datetime [not null, default: `now()`]
  updated_at datetime [not null]

  indexes { listing_id author_id }
}

Table saved_listings {
  id varchar [pk]
  user_id varchar [not null]
  listing_id varchar [not null]
  created_at datetime [not null, default: `now()`]

  indexes { (user_id, listing_id) [unique] }
}

Table reports {
  id varchar [pk]
  reporter_id varchar [not null]
  listing_id varchar [not null]
  reason ReportReason [not null]
  details text
  status ReportStatus [not null, default: 'OPEN']
  reviewed_by_id varchar
  reviewed_at datetime
  created_at datetime [not null, default: `now()`]

  indexes { reporter_id listing_id status }
}

Ref: accommodation_listings.owner_id > users.id [delete: cascade]
Ref: listing_photos.listing_id > accommodation_listings.id [delete: cascade]
Ref: comments.listing_id > accommodation_listings.id [delete: cascade]
Ref: comments.author_id > users.id [delete: cascade]
Ref: saved_listings.user_id > users.id [delete: cascade]
Ref: saved_listings.listing_id > accommodation_listings.id [delete: cascade]
Ref: reports.reporter_id > users.id [delete: cascade]
Ref: reports.listing_id > accommodation_listings.id [delete: cascade]
Ref: reports.reviewed_by_id > users.id [delete: set null]
```

---

## File 4: `04_GEO_ENGINE_AND_RADIUS_SEARCH_SPEC.md`

### Purpose & Mathematical Algorithms
This file provides the complete mathematical, backend, and frontend implementation for location discovery and radius filtering using SQLite and Leaflet.

### 1. In-Memory Haversine & Bounding Box Engine (`src/lib/geo.ts`)
```typescript
export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/**
 * Calculates a coarse latitude/longitude bounding box around a center point.
 * Used for fast indexed SQL range queries in SQLite.
 */
export function getBoundingBox(center: Coordinate, radiusKm: number): BoundingBox {
  const latDelta = radiusKm / 111.32;
  const lngDelta = radiusKm / (111.32 * Math.cos((center.latitude * Math.PI) / 180));

  return {
    minLat: Number((center.latitude - latDelta).toFixed(6)),
    maxLat: Number((center.latitude + latDelta).toFixed(6)),
    minLng: Number((center.longitude - lngDelta).toFixed(6)),
    maxLng: Number((center.longitude + lngDelta).toFixed(6)),
  };
}

/**
 * Calculates exact great-circle distance between two coordinates using the Haversine formula.
 * Earth Radius = 6371 km. Returns distance rounded to 2 decimal places.
 */
export function haversineDistanceKm(coord1: Coordinate, coord2: Coordinate): number {
  const R = 6371; // Earth radius in km
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLng = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.latitude * Math.PI) / 180) *
      Math.cos((coord2.latitude * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}
```

### 2. Location API Query Handler Workflow (`src/app/api/listings/route.ts`)
1. Extract `lat`, `lng`, `radius` (default 3.0 km), `minRent`, `maxRent`, `type`, `genderPreference`, `tenantType`, and `sort` from search params.
2. If `lat` and `lng` are present:
   - Call `getBoundingBox({ latitude: lat, longitude: lng }, radius)`.
   - Query Prisma with SQLite indexed parameters:
     ```ts
     latitude: { gte: minLat, lte: maxLat },
     longitude: { gte: minLng, lte: maxLng },
     availabilityStatus: "AVAILABLE",
     moderationStatus: "APPROVED"
     ```
   - In Node.js, run `haversineDistanceKm()` on returned records to discard corner cases where `distance > radius`.
   - Attach `distanceKm` property to each listing object.
   - If `sort === "nearest"`, sort array by `distanceKm ASC`.
3. If `lat` and `lng` are absent:
   - Run standard database query across all records and apply selected sort (`newest`, `lowest_price`, `highest_price`, `available_soonest`).

---



## File 5: `05_API_CONTRACT_AND_BUSINESS_LOGIC.md`

### Purpose & REST Specifications
This document defines the REST API endpoints, JWT authentication cookie specifications, and multi-filter integration matrix.

### 1. Authentication Endpoints (`/api/auth`)
- `POST /api/auth/register`: Accepts `{ name, email, password, phone, occupation, education }`. Returns HttpOnly cookie `token` (JWT signed with `JWT_SECRET`).
- `POST /api/auth/login`: Accepts `{ email, password }`. Sets HttpOnly cookie `token`.
- `POST /api/auth/logout`: Clears `token` cookie.
- `GET /api/auth/me`: Verifies cookie token, returns current user profile with aggregations (`_count: { listings, savedListings, comments }`).

### 2. Listings Endpoints (`/api/listings`)
- `GET /api/listings`:
  - Query Params: `lat`, `lng`, `radius` (km), `minRent`, `maxRent`, `type` (`SEAT` | `ROOM` | `FLAT`), `genderPreference` (`MALE` | `FEMALE` | `ANY`), `tenantType` (`BACHELOR` | `FAMILY` | `ANY`), `sort` (`nearest` | `newest` | `lowest_price` | `highest_price` | `available_soonest`).
- `POST /api/listings`: Auth required. Accepts JSON listing payload + photo array.
- `GET /api/listings/[id]`: Returns single listing with author details, photos, comments array, and total save count.
- `PATCH /api/listings/[id]/status`: Owner/Admin only. Accepts `{ availabilityStatus: "AVAILABLE" | "RENTED" | "HIDDEN" }`.
- `DELETE /api/listings/[id]`: Owner/Admin only. Deletes listing (triggers cascade delete on photos, comments, saved entries, and reports).

### 3. Comments & Reports (`/api/listings/[id]/comments` & `/api/reports`)
- `POST /api/listings/[id]/comments`: Auth required. Accepts `{ content }`.
- `POST /api/reports`: Auth required. Accepts `{ listingId, reason, details }`. Reason enum: `SCAM`, `INACCURATE`, `NO_LONGER_AVAILABLE`, `DUPLICATE`, `INAPPROPRIATE`, `OTHER`.
- `GET /api/reports`: Admin only. Lists pending moderation reports.
