import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import type { ApiResponse } from "@/types"

type RouteContext = {
  params: Promise<{ id: string; commentId: string }>
}

export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id, commentId } = await context.params
    const comment = await db.comment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true, listingId: true },
    })

    if (!comment || comment.listingId !== id) {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 })
    }

    const isAuthor = comment.authorId === session.userId
    const isAdmin = session.role === "ADMIN"
    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    await db.comment.delete({
      where: { id: commentId },
    })

    return NextResponse.json({ success: true, data: { id: commentId } })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

