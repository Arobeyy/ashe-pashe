# Database Schema — ashepashe

**ORM**: Prisma | **Database**: SQLite (`prisma/dev.db`)

The canonical schema lives at [`prisma/schema.prisma`](../../prisma/schema.prisma).
The DBML visual spec lives at `docs/schema.dbml` (import into [dbdiagram.io](https://dbdiagram.io)).

---

## Models

### User
| Field | Type | Notes |
| :--- | :--- | :--- |
| `id` | `String` (cuid) | PK |
| `name` | `String` | |
| `email` | `String` | Unique |
| `passwordHash` | `String` | bcrypt |
| `phone` | `String?` | |
| `avatarUrl` | `String?` | |
| `coverUrl` | `String?` | Banner background |
| `occupation` | `String?` | Default: "Student" |
| `education` | `String?` | e.g. "University of Dhaka" |
| `location` | `String?` | e.g. "Mirpur, Dhaka" |
| `bio` | `String?` | |
| `interests` | `String` | Serialized JSON array |
| `role` | `String` | `"USER"` \| `"ADMIN"` |

### AccommodationListing
| Field | Type | Notes |
| :--- | :--- | :--- |
| `id` | `String` (cuid) | PK |
| `ownerId` | `String` | FK → User |
| `title` | `String` | |
| `description` | `String` | |
| `monthlyRent` | `Int` | BDT |
| `billsIncluded` | `Boolean` | Default: false |
| `area` | `String` | Indexed |
| `address` | `String` | |
| `latitude` | `Float` | Indexed (composite with longitude) |
| `longitude` | `Float` | Indexed (composite with latitude) |
| `accommodationType` | `String` | `"SEAT"` \| `"ROOM"` \| `"FLAT"` |
| `genderPreference` | `String` | `"MALE"` \| `"FEMALE"` \| `"ANY"` |
| `tenantType` | `String` | `"BACHELOR"` \| `"FAMILY"` \| `"ANY"` |
| `facilities` | `String` | Serialized JSON array |
| `totalRooms` | `Int?` | |
| `totalWashrooms` | `Int?` | |
| `balconies` | `Int?` | |
| `floorLevel` | `Int?` | |
| `availableFrom` | `DateTime` | |
| `availabilityStatus` | `String` | `"AVAILABLE"` \| `"UNAVAILABLE"` \| `"RENTED"` \| `"HIDDEN"` |
| `moderationStatus` | `String` | `"APPROVED"` \| `"PENDING"` \| `"FLAGGED"` \| `"REJECTED"` |
| `expiresAt` | `DateTime?` | |

### ListingPhoto
`id`, `listingId` (FK), `imageUrl`, `displayOrder`, `createdAt`

### Comment
`id`, `listingId` (FK), `authorId` (FK), `content`, `isHidden`, `createdAt`, `updatedAt`

### SavedListing
`id`, `userId` (FK), `listingId` (FK), `createdAt` — unique on `(userId, listingId)`

### Report
`id`, `reporterId` (FK), `listingId` (FK), `reason`, `details?`, `status`, `reviewedById?`, `reviewedAt?`, `createdAt`

**Report reasons**: `SCAM` | `INACCURATE` | `NO_LONGER_AVAILABLE` | `DUPLICATE` | `INAPPROPRIATE` | `OTHER`

**Report status**: `OPEN` | `RESOLVED` | `DISMISSED`

---

## Indexing Strategy

All FK columns are indexed. Additional indexes on:
- `area`, `monthlyRent`, `genderPreference`, `tenantType`, `availabilityStatus` (for filter queries)
- `(latitude, longitude)` composite (for bounding box geo queries)
- `(userId, listingId)` unique composite on `SavedListing`
- `status` on `Report`

---

## Cascade Rules

- Deleting a `User` cascades to their listings, comments, saved listings, filed reports.
- Deleting a `AccommodationListing` cascades to photos, comments, saved entries, reports.
- `Report.reviewedById` sets null on admin deletion.

