import { db } from "@/lib/db"
import { getBoundingBox, haversineDistanceKm } from "@/lib/geo"
import type { Prisma } from "@prisma/client"
import type {
  AccommodationType,
  GenderPreference,
  ListingCard,
  ListingDetail,
  ModerationStatus,
  PhotoItem,
  SortOption,
  TenantType,
} from "@/types"

export type GetListingsParams = {
  lat?: number
  lng?: number
  radius?: number
  minRent?: number
  maxRent?: number
  type?: AccommodationType
  genderPreference?: GenderPreference
  tenantType?: TenantType
  area?: string
  q?: string
  ownerId?: string
  sort?: SortOption
  availabilityStatus?: string
  moderationStatus?: string
  page?: number
  limit?: number
  currentUserId?: string
}

export type GetListingsResult = {
  listings: ListingCard[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

const VALID_ACCOMMODATION_TYPES: AccommodationType[] = ["SEAT", "ROOM", "FLAT"]
const VALID_GENDER_PREFERENCES: GenderPreference[] = ["MALE", "FEMALE", "ANY"]
const VALID_TENANT_TYPES: TenantType[] = ["BACHELOR", "FAMILY", "ANY"]

function parseFacilities(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.map((item) => String(item).trim()).filter(Boolean)
  }
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input)
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean)
      }
    } catch {
      return input
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    }
  }
  return []
}

/**
 * Queries accommodation listings with optional geo-filtering, multi-filter, and pagination.
 */
export async function getListings(params: GetListingsParams): Promise<GetListingsResult> {
  const page = Math.max(1, params.page ?? 1)
  const limit = Math.max(1, Math.min(50, params.limit ?? 12))
  const radius = params.radius ?? 3.0
  const sort = params.sort || "newest"

  const where: Prisma.AccommodationListingWhereInput = {
    availabilityStatus: params.availabilityStatus || "AVAILABLE",
    moderationStatus: params.moderationStatus || "APPROVED",
  }

  if (params.ownerId) where.ownerId = params.ownerId

  const monthlyRentFilter: Prisma.IntFilter<"AccommodationListing"> = {}
  if (params.minRent !== undefined) monthlyRentFilter.gte = params.minRent
  if (params.maxRent !== undefined) monthlyRentFilter.lte = params.maxRent
  if (params.minRent !== undefined || params.maxRent !== undefined) {
    where.monthlyRent = monthlyRentFilter
  }

  if (params.type && VALID_ACCOMMODATION_TYPES.includes(params.type)) {
    where.accommodationType = params.type
  }
  if (params.genderPreference && VALID_GENDER_PREFERENCES.includes(params.genderPreference)) {
    where.genderPreference = params.genderPreference
  }
  if (params.tenantType && VALID_TENANT_TYPES.includes(params.tenantType)) {
    where.tenantType = params.tenantType
  }
  if (params.area) {
    where.area = { contains: params.area }
  }
  if (params.q) {
    where.OR = [
      { title: { contains: params.q } },
      { description: { contains: params.q } },
      { area: { contains: params.q } },
      { address: { contains: params.q } },
    ]
  }

  const hasGeo = params.lat !== undefined && params.lng !== undefined

  if (hasGeo) {
    // Coarse filter via bounding box allows indexed SQL range queries
    const bbox = getBoundingBox({ latitude: params.lat!, longitude: params.lng! }, radius)
    where.latitude = { gte: bbox.minLat, lte: bbox.maxLat }
    where.longitude = { gte: bbox.minLng, lte: bbox.maxLng }

    const rawListings = await db.accommodationListing.findMany({
      where,
      include: {
        photos: { orderBy: { displayOrder: "asc" } },
        owner: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            occupation: true,
            education: true,
          },
        },
        _count: {
          select: {
            comments: true,
            savedByUsers: true,
          },
        },
      },
    })

    const center = { latitude: params.lat!, longitude: params.lng! }
    // Precise Haversine distance calculation discards bounding box corners
    const filtered = rawListings
      .map((listing) => ({
        listing,
        distanceKm: haversineDistanceKm(center, {
          latitude: listing.latitude,
          longitude: listing.longitude,
        }),
      }))
      .filter((item) => item.distanceKm <= radius)

    filtered.sort((a, b) => {
      if (sort === "nearest") return a.distanceKm - b.distanceKm
      if (sort === "lowest_price") return a.listing.monthlyRent - b.listing.monthlyRent
      if (sort === "highest_price") return b.listing.monthlyRent - a.listing.monthlyRent
      if (sort === "available_soonest") {
        return a.listing.availableFrom.getTime() - b.listing.availableFrom.getTime()
      }
      return b.listing.createdAt.getTime() - a.listing.createdAt.getTime()
    })

    const total = filtered.length
    const totalPages = Math.ceil(total / limit) || 1
    const paged = filtered.slice((page - 1) * limit, page * limit)

    const savedListingIds = new Set<string>()
    if (params.currentUserId && paged.length > 0) {
      const saved = await db.savedListing.findMany({
        where: {
          userId: params.currentUserId,
          listingId: { in: paged.map((i) => i.listing.id) },
        },
        select: { listingId: true },
      })
      saved.forEach((s) => savedListingIds.add(s.listingId))
    }

    const listings: ListingCard[] = paged.map(({ listing, distanceKm }) => ({
      id: listing.id,
      ownerId: listing.ownerId,
      title: listing.title,
      description: listing.description,
      monthlyRent: listing.monthlyRent,
      billsIncluded: listing.billsIncluded,
      area: listing.area,
      address: listing.address,
      latitude: listing.latitude,
      longitude: listing.longitude,
      accommodationType: listing.accommodationType as AccommodationType,
      genderPreference: listing.genderPreference as GenderPreference,
      tenantType: listing.tenantType as TenantType,
      facilities: parseFacilities(listing.facilities),
      totalRooms: listing.totalRooms,
      totalWashrooms: listing.totalWashrooms,
      balconies: listing.balconies,
      floorLevel: listing.floorLevel,
      availabilityStatus: listing.availabilityStatus as ListingCard["availabilityStatus"],
      availableFrom: listing.availableFrom.toISOString(),
      createdAt: listing.createdAt.toISOString(),
      distanceKm,
      photos: listing.photos.map((p) => ({
        id: p.id,
        imageUrl: p.imageUrl,
        displayOrder: p.displayOrder,
      })),
      owner: listing.owner,
      commentsCount: listing._count.comments,
      savedCount: listing._count.savedByUsers,
      isSaved: savedListingIds.has(listing.id),
    }))

    return {
      listings,
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    }
  }

  let orderBy: Prisma.AccommodationListingOrderByWithRelationInput = { createdAt: "desc" }
  if (sort === "lowest_price") orderBy = { monthlyRent: "asc" }
  else if (sort === "highest_price") orderBy = { monthlyRent: "desc" }
  else if (sort === "available_soonest") orderBy = { availableFrom: "asc" }

  const [rawListings, total] = await Promise.all([
    db.accommodationListing.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        photos: { orderBy: { displayOrder: "asc" } },
        owner: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            occupation: true,
            education: true,
          },
        },
        _count: {
          select: {
            comments: true,
            savedByUsers: true,
          },
        },
      },
    }),
    db.accommodationListing.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit) || 1

  const savedListingIds = new Set<string>()
  if (params.currentUserId && rawListings.length > 0) {
    const saved = await db.savedListing.findMany({
      where: {
        userId: params.currentUserId,
        listingId: { in: rawListings.map((l) => l.id) },
      },
      select: { listingId: true },
    })
    saved.forEach((s) => savedListingIds.add(s.listingId))
  }

  const listings: ListingCard[] = rawListings.map((listing) => ({
    id: listing.id,
    ownerId: listing.ownerId,
    title: listing.title,
    description: listing.description,
    monthlyRent: listing.monthlyRent,
    billsIncluded: listing.billsIncluded,
    area: listing.area,
    address: listing.address,
    latitude: listing.latitude,
    longitude: listing.longitude,
    accommodationType: listing.accommodationType as AccommodationType,
    genderPreference: listing.genderPreference as GenderPreference,
    tenantType: listing.tenantType as TenantType,
    facilities: parseFacilities(listing.facilities),
    totalRooms: listing.totalRooms,
    totalWashrooms: listing.totalWashrooms,
    balconies: listing.balconies,
    floorLevel: listing.floorLevel,
    availabilityStatus: listing.availabilityStatus as ListingCard["availabilityStatus"],
    availableFrom: listing.availableFrom.toISOString(),
    createdAt: listing.createdAt.toISOString(),
    photos: listing.photos.map((p) => ({
      id: p.id,
      imageUrl: p.imageUrl,
      displayOrder: p.displayOrder,
    })),
    owner: listing.owner,
    commentsCount: listing._count.comments,
    savedCount: listing._count.savedByUsers,
    isSaved: savedListingIds.has(listing.id),
  }))

  return {
    listings,
    total,
    page,
    limit,
    totalPages,
    hasMore: page < totalPages,
  }
}

/**
 * Fetches a single accommodation listing with its owner, photos, comments, and saved status.
 */
export async function getListingById(
  id: string,
  currentUserId?: string,
): Promise<ListingDetail | null> {
  const listing = await db.accommodationListing.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          occupation: true,
          education: true,
          createdAt: true,
        },
      },
      photos: {
        orderBy: { displayOrder: "asc" },
      },
      comments: {
        where: { isHidden: false },
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      },
      _count: {
        select: {
          savedByUsers: true,
        },
      },
    },
  })

  if (!listing) return null

  let isSaved = false
  if (currentUserId) {
    const saved = await db.savedListing.findUnique({
      where: {
        userId_listingId: {
          userId: currentUserId,
          listingId: id,
        },
      },
    })
    isSaved = Boolean(saved)
  }

  return {
    id: listing.id,
    ownerId: listing.ownerId,
    title: listing.title,
    description: listing.description,
    monthlyRent: listing.monthlyRent,
    billsIncluded: listing.billsIncluded,
    area: listing.area,
    address: listing.address,
    latitude: listing.latitude,
    longitude: listing.longitude,
    accommodationType: listing.accommodationType as AccommodationType,
    genderPreference: listing.genderPreference as GenderPreference,
    tenantType: listing.tenantType as TenantType,
    facilities: parseFacilities(listing.facilities),
    totalRooms: listing.totalRooms,
    totalWashrooms: listing.totalWashrooms,
    balconies: listing.balconies,
    floorLevel: listing.floorLevel,
    availableFrom: listing.availableFrom.toISOString(),
    availabilityStatus: listing.availabilityStatus as ListingDetail["availabilityStatus"],
    moderationStatus: listing.moderationStatus as ModerationStatus,
    createdAt: listing.createdAt.toISOString(),
    photos: listing.photos.map((p) => ({
      id: p.id,
      imageUrl: p.imageUrl,
      displayOrder: p.displayOrder,
    })),
    owner: listing.owner,
    comments: listing.comments.map((c) => ({
      id: c.id,
      listingId: c.listingId,
      authorId: c.authorId,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      author: c.author,
    })),
    savedCount: listing._count.savedByUsers,
    isSaved,
  }
}

