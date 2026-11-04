import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import type {
  AccommodationType,
  ApiResponse,
  AvailabilityStatus,
  ModerationStatus,
  ReportItem,
  ReportReason,
  ReportStatus,
  UpdateReportInput,
} from "@/types"

type RouteContext = {
  params: Promise<{ id: string }>
}

const ALLOWED_PATCH_STATUSES: ReportStatus[] = ["RESOLVED", "DISMISSED", "OPEN"]

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<NextResponse<ApiResponse<ReportItem>>> {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const report = await db.report.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            area: true,
            address: true,
            monthlyRent: true,
            accommodationType: true,
            availabilityStatus: true,
            moderationStatus: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
            photos: {
              take: 1,
              orderBy: { displayOrder: "asc" },
              select: { imageUrl: true },
            },
          },
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!report) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 })
    }

    if (session.role !== "ADMIN" && session.userId !== report.reporterId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const data: ReportItem = {
      id: report.id,
      listingId: report.listingId,
      reporterId: report.reporterId,
      reason: report.reason as ReportReason,
      details: report.details,
      status: report.status as ReportStatus,
      reviewedById: report.reviewedById,
      reviewedAt: report.reviewedAt?.toISOString() || null,
      createdAt: report.createdAt.toISOString(),
      reporter: report.reporter,
      listing: {
        id: report.listing.id,
        title: report.listing.title,
        area: report.listing.area,
        address: report.listing.address,
        monthlyRent: report.listing.monthlyRent,
        accommodationType: report.listing.accommodationType as AccommodationType,
        availabilityStatus: report.listing.availabilityStatus as AvailabilityStatus,
        moderationStatus: report.listing.moderationStatus as ModerationStatus,
        owner: report.listing.owner,
        photos: report.listing.photos,
      },
      reviewedBy: report.reviewedBy,
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse<ApiResponse<ReportItem>>> {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const { id } = await context.params
    const body = (await request.json()) as UpdateReportInput

    if (!body.status || !ALLOWED_PATCH_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${ALLOWED_PATCH_STATUSES.join(", ")}` },
        { status: 400 },
      )
    }

    const existing = await db.report.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 })
    }

    const isClosing = body.status === "RESOLVED" || body.status === "DISMISSED"
    const updated = await db.report.update({
      where: { id },
      data: {
        status: body.status,
        reviewedById: isClosing ? session.userId : null,
        reviewedAt: isClosing ? new Date() : null,
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            area: true,
            address: true,
            monthlyRent: true,
            accommodationType: true,
            availabilityStatus: true,
            moderationStatus: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
            photos: {
              take: 1,
              orderBy: { displayOrder: "asc" },
              select: { imageUrl: true },
            },
          },
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    const data: ReportItem = {
      id: updated.id,
      listingId: updated.listingId,
      reporterId: updated.reporterId,
      reason: updated.reason as ReportReason,
      details: updated.details,
      status: updated.status as ReportStatus,
      reviewedById: updated.reviewedById,
      reviewedAt: updated.reviewedAt?.toISOString() || null,
      createdAt: updated.createdAt.toISOString(),
      reporter: updated.reporter,
      listing: {
        id: updated.listing.id,
        title: updated.listing.title,
        area: updated.listing.area,
        address: updated.listing.address,
        monthlyRent: updated.listing.monthlyRent,
        accommodationType: updated.listing.accommodationType as AccommodationType,
        availabilityStatus: updated.listing.availabilityStatus as AvailabilityStatus,
        moderationStatus: updated.listing.moderationStatus as ModerationStatus,
        owner: updated.listing.owner,
        photos: updated.listing.photos,
      },
      reviewedBy: updated.reviewedBy,
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

