import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import type { ApiResponse } from "@/types"

type SavedListingItem = {
  listingId: string
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<{ saved: boolean; listingId: string }>>> {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    let body: { listingId?: string }
    try {
      body = (await request.json()) as { listingId?: string }
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 })
    }

    const listingId = body.listingId?.trim()

    if (!listingId) {
      return NextResponse.json({ success: false, error: "listingId is required" }, { status: 400 })
    }

    const listing = await db.accommodationListing.findUnique({
      where: { id: listingId },
      select: { id: true },
    })

    if (!listing) {
      return NextResponse.json({ success: false, error: "Listing not found" }, { status: 404 })
    }

    const existing = await db.savedListing.findUnique({
      where: {
        userId_listingId: {
          userId: session.userId,
          listingId,
        },
      },
    })

    if (existing) {
      await db.savedListing.delete({
        where: { id: existing.id },
      })
      return NextResponse.json({
        success: true,
        data: { saved: false, listingId },
      })
    }

    await db.savedListing.create({
      data: {
        userId: session.userId,
        listingId,
      },
    })

    return NextResponse.json({
      success: true,
      data: { saved: true, listingId },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<string[]>>> {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const saved: SavedListingItem[] = await db.savedListing.findMany({
      where: { userId: session.userId },
      select: { listingId: true },
    })

    return NextResponse.json({
      success: true,
      data: saved.map((s: SavedListingItem) => s.listingId),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
