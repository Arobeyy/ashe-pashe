# Geo Engine & Radius Search — ashepashe

**Map library**: Leaflet + OpenStreetMap via `react-leaflet` (no API key required).
**Algorithm**: Coarse bounding box (SQL indexed) → precise Haversine filtering (Node.js in-memory).

---

## Core Library: `src/lib/geo.ts`

Two exported functions:

### `getBoundingBox(center, radiusKm)`
Computes a lat/lng bounding box for fast SQLite range queries.

```
latDelta  = radiusKm / 111.32
lngDelta  = radiusKm / (111.32 × cos(lat × π/180))
```

Returns `{ minLat, maxLat, minLng, maxLng }` rounded to 6 decimal places.

### `haversineDistanceKm(coord1, coord2)`
Exact great-circle distance using the Haversine formula (Earth radius = 6371 km). Returns distance in km rounded to 2 decimal places.

---

## Search Workflow (`GET /api/listings`)

**When `lat` + `lng` are provided:**
1. Compute bounding box with `getBoundingBox(center, radius)` (default radius: 3.0 km).
2. Prisma query with indexed filters: `latitude ≥ minLat`, `latitude ≤ maxLat`, `longitude ≥ minLng`, `longitude ≤ maxLng`, `availabilityStatus = "AVAILABLE"`, `moderationStatus = "APPROVED"`.
3. Run `haversineDistanceKm()` on results to discard bounding box corners where `distance > radius`.
4. Attach `distanceKm` to each result object.
5. If `sort === "nearest"`, sort ascending by `distanceKm`.

**When `lat` + `lng` are absent:**
- Standard DB query with sort options: `newest`, `lowest_price`, `highest_price`, `available_soonest`.

---

## Map UI Rules

- Always dynamically import Leaflet components: `dynamic(() => import('...'), { ssr: false })`.
- This prevents `window is not defined` SSR hydration errors in Next.js.
- Map picker on listing creation lets the user drag a pin to set `latitude` + `longitude`.

---

## Query Parameters Reference

| Param | Type | Default | Notes |
| :--- | :--- | :--- | :--- |
| `lat` | `number` | — | Center latitude |
| `lng` | `number` | — | Center longitude |
| `radius` | `number` | `3.0` | km |
| `minRent` | `number` | — | |
| `maxRent` | `number` | — | |
| `type` | `string` | — | `SEAT` \| `ROOM` \| `FLAT` |
| `genderPreference` | `string` | — | `MALE` \| `FEMALE` \| `ANY` |
| `tenantType` | `string` | — | `BACHELOR` \| `FAMILY` \| `ANY` |
| `sort` | `string` | `newest` | `nearest` \| `newest` \| `lowest_price` \| `highest_price` \| `available_soonest` |

