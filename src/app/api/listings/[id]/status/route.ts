import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import type { ApiResponse, AvailabilityStatus, ListingCard, UpdateListingStatusInput } from "@/types"

type RouteContext = {
  params: Promise<{ id: string }>
}

const VALID_STATUSES: AvailabilityStatus[] = ["AVAILABLE", "UNAVAILABLE", "RENTED", "HIDDEN"]

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse<ApiResponse<ListingCard>>> {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const listing = await db.accommodationListing.findUnique({
      where: { id },
    })

    if (!listing) {
      return NextResponse.json({ success: false, error: "Listing not found" }, { status: 404 })
    }

    const isOwner = listing.ownerId === session.userId
    const isAdmin = session.role === "ADMIN"
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    let body: UpdateListingStatusInput
    try {
      body = (await request.json()) as UpdateListingStatusInput
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 })
    }
    if (!body.availabilityStatus || !VALID_STATUSES.includes(body.availabilityStatus)) {
      return NextResponse.json(
        { success: false, error: `Invalid availabilityStatus. Must be: ${VALID_STATUSES.join(", ")}` },
        { status: 400 },
      )
    }

    const updated = await db.accommodationListing.update({
      where: { id },
      data: {
        availabilityStatus: body.availabilityStatus,
      },
      include: {
        photos: {
          orderBy: { displayOrder: "asc" },
        },
      },
    })

    const card: ListingCard = {
      id: updated.id,
      ownerId: updated.ownerId,
      title: updated.title,
      monthlyRent: updated.monthlyRent,
      billsIncluded: updated.billsIncluded,
      area: updated.area,
      address: updated.address,
      latitude: updated.latitude,
      longitude: updated.longitude,
      accommodationType: updated.accommodationType as ListingCard["accommodationType"],
      genderPreference: updated.genderPreference as ListingCard["genderPreference"],
      tenantType: updated.tenantType as ListingCard["tenantType"],
      availabilityStatus: updated.availabilityStatus as ListingCard["availabilityStatus"],
      availableFrom: updated.availableFrom.toISOString(),
      createdAt: updated.createdAt.toISOString(),
      photos: updated.photos.map((p) => ({
        id: p.id,
        imageUrl: p.imageUrl,
        displayOrder: p.displayOrder,
      })),
    }

    return NextResponse.json({ success: true, data: card })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
