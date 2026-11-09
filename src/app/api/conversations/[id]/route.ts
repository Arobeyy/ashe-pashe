import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import type { ApiResponse, ConversationDetail } from "@/types"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse<ApiResponse<ConversationDetail>>> {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const conversation = await db.conversation.findUnique({
      where: { id },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            occupation: true,
            education: true,
            location: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            occupation: true,
            education: true,
            location: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            monthlyRent: true,
            area: true,
            photos: {
              take: 1,
              orderBy: { displayOrder: "asc" },
              select: { imageUrl: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 })
    }

    if (conversation.user1Id !== session.userId && conversation.user2Id !== session.userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    // Mark messages sent by the other participant as read
    await db.message.updateMany({
      where: {
        conversationId: id,
        senderId: { not: session.userId },
        isRead: false,
      },
      data: { isRead: true },
    })

    const otherUser = conversation.user1Id === session.userId ? conversation.user2 : conversation.user1

    const detail: ConversationDetail = {
      id: conversation.id,
      otherUser,
      listing: conversation.listing
        ? {
            id: conversation.listing.id,
            title: conversation.listing.title,
            monthlyRent: conversation.listing.monthlyRent,
            area: conversation.listing.area,
            imageUrl: conversation.listing.photos[0]?.imageUrl ?? null,
          }
        : null,
      messages: conversation.messages.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        content: m.content,
        photoUrl: m.photoUrl,
        isRead: m.isRead,
        createdAt: m.createdAt.toISOString(),
        sender: m.sender,
      })),
    }

    return NextResponse.json({ success: true, data: detail })
  } catch (error) {
    console.error("GET /api/conversations/[id] failed:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch conversation details" }, { status: 500 })
  }
}
