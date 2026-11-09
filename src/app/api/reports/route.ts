import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import type { Prisma } from "@prisma/client"
import type {
  AccommodationType,
  ApiResponse,
  AvailabilityStatus,
  ModerationStatus,
  PaginationMeta,
  ReportItem,
  ReportReason,
  ReportStatus,
} from "@/types"

export type ReportWithRelationsPayload = Prisma.ReportGetPayload<{
  include: {
    reporter: {
      select: {
        id: true
        name: true
        email: true
        avatarUrl: true
      }
    }
    listing: {
      select: {
        id: true
        title: true
        area: true
        address: true
        monthlyRent: true
        accommodationType: true
        availabilityStatus: true
        moderationStatus: true
        owner: {
          select: {
            id: true
            name: true
            email: true
            avatarUrl: true
          }
        }
        photos: {
          take: 1
          orderBy: { displayOrder: "asc" }
          select: { imageUrl: true }
        }
      }
    }
    reviewedBy: {
      select: {
        id: true
        name: true
        email: true
      }
    }
  }
}>

const VALID_REASONS: ReportReason[] = [
  "SCAM",
  "INACCURATE",
  "NO_LONGER_AVAILABLE",
  "DUPLICATE",
  "INAPPROPRIATE",
  "OTHER",
]

const VALID_STATUSES: ReportStatus[] = ["OPEN", "RESOLVED", "DISMISSED"]

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<ReportItem[]>>> {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const searchParams = request.nextUrl?.searchParams ?? new URL(request.url).searchParams
    const statusParam = searchParams.get("status")?.toUpperCase()
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20))
    const skip = (page - 1) * limit

    const where: { status?: string } = {}
    if (statusParam && statusParam !== "ALL") {
      if (!VALID_STATUSES.includes(statusParam as ReportStatus)) {
        return NextResponse.json(
          { success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}, ALL` },
          { status: 400 },
        )
      }
      where.status = statusParam
    } else if (!statusParam) {
      where.status = "OPEN"
    }

    const [reports, total]: [ReportWithRelationsPayload[], number] = await Promise.all([
      db.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
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
      }),
      db.report.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit) || 1
    const pagination: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    }

    const data: ReportItem[] = reports.map((r: ReportWithRelationsPayload) => ({
      id: r.id,
      listingId: r.listingId,
      reporterId: r.reporterId,
      reason: r.reason as ReportReason,
      details: r.details,
      status: r.status as ReportStatus,
      reviewedById: r.reviewedById,
      reviewedAt: r.reviewedAt?.toISOString() || null,
      createdAt: r.createdAt.toISOString(),
      reporter: r.reporter,
      listing: {
        id: r.listing.id,
        title: r.listing.title,
        area: r.listing.area,
        address: r.listing.address,
        monthlyRent: r.listing.monthlyRent,
        accommodationType: r.listing.accommodationType as AccommodationType,
        availabilityStatus: r.listing.availabilityStatus as AvailabilityStatus,
        moderationStatus: r.listing.moderationStatus as ModerationStatus,
        owner: r.listing.owner,
        photos: r.listing.photos,
      },
      reviewedBy: r.reviewedBy,
    }))

    return NextResponse.json({ success: true, data, pagination })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<{ id: string; listingId: string }>>> {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    let body: {
      listingId?: string
      reason?: ReportReason
      details?: string
    }

    try {
      body = (await request.json()) as {
        listingId?: string
        reason?: ReportReason
        details?: string
      }
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 })
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

    return NextResponse.json(
      {
        success: true,
        data: { id: report.id, listingId: report.listingId },
      },
      { status: 201 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
