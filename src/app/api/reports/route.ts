import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import type { ApiResponse, ReportReason } from "@/types"

const VALID_REASONS: ReportReason[] = [
  "SCAM",
  "INACCURATE",
  "NO_LONGER_AVAILABLE",
  "DUPLICATE",
  "INAPPROPRIATE",
  "OTHER",
]

export async function POST(
  request: Request,
): Promise<NextResponse<ApiResponse<{ id: string; listingId: string }>>> {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as {
      listingId?: string
      reason?: ReportReason
      details?: string
    }

    const listingId = body.listingId?.trim()
    const reason = body.reason

    if (!listingId) {
      return NextResponse.json({ success: false, error: "listingId is required" }, { status: 400 })
    }

    if (!reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json(
        { success: false, error: `Invalid reason. Must be one of: ${VALID_REASONS.join(", ")}` },
        { status: 400 },
      )
    }

    const listing = await db.accommodationListing.findUnique({
      where: { id: listingId },
      select: { id: true },
    })

    if (!listing) {
      return NextResponse.json({ success: false, error: "Listing not found" }, { status: 404 })
    }

    const report = await db.report.create({
      data: {
        reporterId: session.userId,
        listingId,
        reason,
        details: body.details?.trim() || null,
        status: "OPEN",
      },
    })

    return NextResponse.json({
      success: true,
      data: { id: report.id, listingId: report.listingId },
    }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

