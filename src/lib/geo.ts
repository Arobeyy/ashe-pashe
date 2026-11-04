export interface Coordinate {
  latitude: number
  longitude: number
}

export interface BoundingBox {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

// Calculates a coarse bounding box around center point for indexed SQL queries
export function getBoundingBox(center: Coordinate, radiusKm: number): BoundingBox {
  const latDelta = radiusKm / 111.32
  const lngDelta = radiusKm / (111.32 * Math.cos((center.latitude * Math.PI) / 180))

  return {
    minLat: Number((center.latitude - latDelta).toFixed(6)),
    maxLat: Number((center.latitude + latDelta).toFixed(6)),
    minLng: Number((center.longitude - lngDelta).toFixed(6)),
    maxLng: Number((center.longitude + lngDelta).toFixed(6)),
  }
}

// Calculates great-circle distance between two coordinates using Haversine formula
export function haversineDistanceKm(coord1: Coordinate, coord2: Coordinate): number {
  const R = 6371
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180
  const dLng = ((coord2.longitude - coord1.longitude) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.latitude * Math.PI) / 180) *
      Math.cos((coord2.latitude * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Number((R * c).toFixed(2))
}

