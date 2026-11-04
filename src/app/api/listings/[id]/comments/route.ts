import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import type { ApiResponse, CommentItem } from "@/types"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<NextResponse<ApiResponse<CommentItem>>> {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const body = (await request.json()) as { content?: string }
    const content = body.content?.trim()

    if (!content) {
      return NextResponse.json({ success: false, error: "Comment content is required" }, { status: 400 })
    }

    if (content.length > 1000) {
      return NextResponse.json({ success: false, error: "Comment cannot exceed 1000 characters" }, { status: 400 })
    }

    const listing = await db.accommodationListing.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!listing) {
      return NextResponse.json({ success: false, error: "Listing not found" }, { status: 404 })
    }

    const created = await db.comment.create({
      data: {
        listingId: id,
        authorId: session.userId,
        content,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    })

    const commentItem: CommentItem = {
      id: created.id,
      listingId: created.listingId,
      authorId: created.authorId,
      content: created.content,
      createdAt: created.createdAt.toISOString(),
      author: created.author,
    }

    return NextResponse.json({ success: true, data: commentItem }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

