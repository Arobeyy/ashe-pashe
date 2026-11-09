import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { getListings } from "@/lib/listings"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import type {
  AccommodationType,
  ApiResponse,
  CreateListingInput,
  GenderPreference,
  ListingCard,
  SortOption,
  TenantType,
} from "@/types"

const VALID_ACCOMMODATION_TYPES: AccommodationType[] = ["SEAT", "ROOM", "FLAT"]
const VALID_GENDER_PREFERENCES: GenderPreference[] = ["MALE", "FEMALE", "ANY"]
const VALID_TENANT_TYPES: TenantType[] = ["BACHELOR", "FAMILY", "ANY"]

function parseNumber(value: string | null): number | undefined {
  if (!value) return undefined
  const num = Number(value)
  return isNaN(num) ? undefined : num
}

function parseFacilities(input: unknown): string {
  if (Array.isArray(input)) {
    return JSON.stringify(input.map((item) => String(item).trim()).filter(Boolean))
  }
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input)
      if (Array.isArray(parsed)) {
        return JSON.stringify(parsed.map((item) => String(item).trim()).filter(Boolean))
      }
    } catch {
      return JSON.stringify(
        input
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      )
    }
  }
  return "[]"
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<ListingCard[]>>> {
  try {
    const searchParams = request.nextUrl?.searchParams ?? new URL(request.url).searchParams
    const session = await getSession(request)

    const result = await getListings({
      lat: parseNumber(searchParams.get("lat")),
      lng: parseNumber(searchParams.get("lng")),
      radius: parseNumber(searchParams.get("radius")),
      minRent: parseNumber(searchParams.get("minRent")),
      maxRent: parseNumber(searchParams.get("maxRent")),
      type: (searchParams.get("type") as AccommodationType | null) ?? undefined,
      genderPreference: (searchParams.get("genderPreference") as GenderPreference | null) ?? undefined,
      tenantType: (searchParams.get("tenantType") as TenantType | null) ?? undefined,
      area: searchParams.get("area")?.trim() || undefined,
      q: searchParams.get("q")?.trim() || undefined,
      ownerId: searchParams.get("ownerId")?.trim() || undefined,
      sort: (searchParams.get("sort") as SortOption) || "newest",
      availabilityStatus: searchParams.get("availabilityStatus") || "AVAILABLE",
      moderationStatus: searchParams.get("moderationStatus") || "APPROVED",
      page: parseNumber(searchParams.get("page")),
      limit: parseNumber(searchParams.get("limit")),
      currentUserId: session?.userId,
    })

    return NextResponse.json({
      success: true,
      data: result.listings,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasMore: result.hasMore,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<ListingCard>>> {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const contentType = request.headers.get("content-type") || ""
    const photoUrls: { imageUrl: string; displayOrder: number }[] = []
    let payload: Partial<CreateListingInput> = {}

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()

      payload = {
        title: formData.get("title")?.toString().trim(),
        description: formData.get("description")?.toString().trim(),
        monthlyRent: Number(formData.get("monthlyRent")),
        billsIncluded: formData.get("billsIncluded") === "true",
        area: formData.get("area")?.toString().trim(),
        address: formData.get("address")?.toString().trim(),
        latitude: Number(formData.get("latitude")),
        longitude: Number(formData.get("longitude")),
        accommodationType: formData.get("accommodationType")?.toString().trim() as AccommodationType,
        genderPreference: (formData.get("genderPreference")?.toString().trim() as GenderPreference) || "ANY",
        tenantType: (formData.get("tenantType")?.toString().trim() as TenantType) || "BACHELOR",
        facilities: formData.get("facilities")?.toString(),
        totalRooms: formData.get("totalRooms") ? Number(formData.get("totalRooms")) : null,
        totalWashrooms: formData.get("totalWashrooms") ? Number(formData.get("totalWashrooms")) : null,
        balconies: formData.get("balconies") ? Number(formData.get("balconies")) : null,
        floorLevel: formData.get("floorLevel") ? Number(formData.get("floorLevel")) : null,
        availableFrom: formData.get("availableFrom")?.toString(),
      }

      const files = formData.getAll("photos")
      const uploadsDir = path.join(process.cwd(), "public", "uploads")
      await mkdir(uploadsDir, { recursive: true })

      let order = 0
      for (const entry of files) {
        if (entry instanceof File && entry.size > 0) {
          const extension = entry.name.split(".").pop()?.toLowerCase() || "jpg"
          const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(extension) ? extension : "jpg"
          const filename = `${Date.now()}-${crypto.randomUUID()}.${safeExt}`
          const buffer = Buffer.from(await entry.arrayBuffer())
          await writeFile(path.join(uploadsDir, filename), buffer)
          photoUrls.push({ imageUrl: `/uploads/${filename}`, displayOrder: order++ })
        } else if (typeof entry === "string" && entry.trim().length > 0) {
          photoUrls.push({ imageUrl: entry.trim(), displayOrder: order++ })
        }
      }
    } else {
      try {
        payload = (await request.json()) as CreateListingInput
      } catch {
        return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 })
      }
      if (Array.isArray(payload.photos)) {
        payload.photos.forEach((item, index) => {
          if (typeof item === "string" && item.trim()) {
            photoUrls.push({ imageUrl: item.trim(), displayOrder: index })
          } else if (item && typeof item === "object" && "imageUrl" in item && item.imageUrl) {
            photoUrls.push({
              imageUrl: item.imageUrl,
              displayOrder: typeof item.displayOrder === "number" ? item.displayOrder : index,
            })
          }
        })
      }
    }

    if (!payload.title || payload.title.length < 3) {
      return NextResponse.json({ success: false, error: "Title must be at least 3 characters" }, { status: 400 })
    }
    if (!payload.description) {
      return NextResponse.json({ success: false, error: "Description is required" }, { status: 400 })
    }
    if (!payload.monthlyRent || isNaN(payload.monthlyRent) || payload.monthlyRent <= 0) {
      return NextResponse.json({ success: false, error: "Monthly rent must be a positive number" }, { status: 400 })
    }
    if (!payload.area) {
      return NextResponse.json({ success: false, error: "Area is required" }, { status: 400 })
    }
    if (!payload.address) {
      return NextResponse.json({ success: false, error: "Address is required" }, { status: 400 })
    }
    if (payload.latitude === undefined || isNaN(payload.latitude) || payload.latitude < -90 || payload.latitude > 90) {
      return NextResponse.json({ success: false, error: "Latitude must be between -90 and 90" }, { status: 400 })
    }
    if (payload.longitude === undefined || isNaN(payload.longitude) || payload.longitude < -180 || payload.longitude > 180) {
      return NextResponse.json({ success: false, error: "Longitude must be between -180 and 180" }, { status: 400 })
    }
    if (!payload.accommodationType || !VALID_ACCOMMODATION_TYPES.includes(payload.accommodationType)) {
      return NextResponse.json(
        { success: false, error: `Invalid accommodationType. Must be: ${VALID_ACCOMMODATION_TYPES.join(", ")}` },
        { status: 400 },
      )
    }

    const genderPreference = payload.genderPreference && VALID_GENDER_PREFERENCES.includes(payload.genderPreference)
      ? payload.genderPreference
      : "ANY"
    const tenantType = payload.tenantType && VALID_TENANT_TYPES.includes(payload.tenantType)
      ? payload.tenantType
      : "BACHELOR"

    const availableDate = payload.availableFrom ? new Date(payload.availableFrom) : new Date()
    if (isNaN(availableDate.getTime())) {
      return NextResponse.json({ success: false, error: "Invalid availableFrom date" }, { status: 400 })
    }

    const created = await db.accommodationListing.create({
      data: {
        ownerId: session.userId,
        title: payload.title,
        description: payload.description,
        monthlyRent: Math.round(payload.monthlyRent),
        billsIncluded: Boolean(payload.billsIncluded),
        area: payload.area,
        address: payload.address,
        latitude: payload.latitude,
        longitude: payload.longitude,
        accommodationType: payload.accommodationType,
        genderPreference,
        tenantType,
        facilities: parseFacilities(payload.facilities),
        totalRooms: payload.totalRooms ?? null,
        totalWashrooms: payload.totalWashrooms ?? null,
        balconies: payload.balconies ?? null,
        floorLevel: payload.floorLevel ?? null,
        availableFrom: availableDate,
        availabilityStatus: "AVAILABLE",
        moderationStatus: "APPROVED",
        photos: {
          create: photoUrls,
        },
      },
      include: {
        photos: {
          orderBy: { displayOrder: "asc" },
        },
      },
    })

    const card: ListingCard = {
      id: created.id,
      ownerId: created.ownerId,
      title: created.title,
      monthlyRent: created.monthlyRent,
      billsIncluded: created.billsIncluded,
      area: created.area,
      address: created.address,
      latitude: created.latitude,
      longitude: created.longitude,
      accommodationType: created.accommodationType as AccommodationType,
      genderPreference: created.genderPreference as GenderPreference,
      tenantType: created.tenantType as TenantType,
      availabilityStatus: created.availabilityStatus as ListingCard["availabilityStatus"],
      availableFrom: created.availableFrom.toISOString(),
      createdAt: created.createdAt.toISOString(),
      photos: created.photos.map((p: { id: string; imageUrl: string; displayOrder: number }) => ({
        id: p.id,
        imageUrl: p.imageUrl,
        displayOrder: p.displayOrder,
      })),
    }

    return NextResponse.json({ success: true, data: card }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
