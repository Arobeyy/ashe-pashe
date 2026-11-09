import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { getListingById } from "@/lib/listings"
import { unlink } from "fs/promises"
import path from "path"
import type { ApiResponse, ListingDetail } from "@/types"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse<ApiResponse<ListingDetail>>> {
  try {
    const { id } = await context.params
    const session = await getSession(request)

    const listing = await getListingById(id, session?.userId)
    if (!listing) {
      return NextResponse.json({ success: false, error: "Listing not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: listing })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const listing = await db.accommodationListing.findUnique({
      where: { id },
      include: {
        photos: {
          select: { imageUrl: true },
        },
      },
    })

    if (!listing) {
      return NextResponse.json({ success: false, error: "Listing not found" }, { status: 404 })
    }

    const isOwner = listing.ownerId === session.userId
    const isAdmin = session.role === "ADMIN"
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    // Cascade in Prisma schema handles photos, comments, saves, and reports
    await db.accommodationListing.delete({
      where: { id },
    })

    for (const photo of listing.photos) {
      if (photo.imageUrl.startsWith("/uploads/")) {
        const filePath = path.join(process.cwd(), "public", photo.imageUrl)
        unlink(filePath).catch(() => {})
      }
    }

    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
