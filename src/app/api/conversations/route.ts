import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { getUserConversations } from "@/lib/conversations"
import type { ApiResponse, ConversationSummary } from "@/types"

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<ConversationSummary[]>>> {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const conversationSummaries = await getUserConversations(session.userId)
    return NextResponse.json({ success: true, data: conversationSummaries })
  } catch (error) {
    console.error("GET /api/conversations failed:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch conversations" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<{ conversationId: string }>>> {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body.recipientId !== "string" || !body.recipientId) {
      return NextResponse.json({ success: false, error: "Recipient ID is required" }, { status: 400 })
    }

    const { recipientId, listingId, initialMessage } = body

    if (recipientId === session.userId) {
      return NextResponse.json({ success: false, error: "Cannot message yourself" }, { status: 400 })
    }

    const recipient = await db.user.findUnique({
      where: { id: recipientId },
      select: { id: true },
    })

    if (!recipient) {
      return NextResponse.json({ success: false, error: "Recipient not found" }, { status: 404 })
    }

    // Canonicalize participant IDs so user1Id is always alphabetically earlier
    const [user1Id, user2Id] = [session.userId, recipientId].sort()

    let conversation = await db.conversation.findFirst({
      where: {
        user1Id,
        user2Id,
        listingId: listingId || null,
      },
    })

    if (!conversation && !listingId) {
      conversation = await db.conversation.findFirst({
        where: {
          user1Id,
          user2Id,
        },
      })
    }

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          user1Id,
          user2Id,
          listingId: listingId || null,
        },
      })
    }

    if (typeof initialMessage === "string" && initialMessage.trim().length > 0) {
      await db.message.create({
        data: {
          conversationId: conversation.id,
          senderId: session.userId,
          content: initialMessage.trim(),
        },
      })
      await db.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      })
    }

    return NextResponse.json({ success: true, data: { conversationId: conversation.id } })
  } catch (error) {
    console.error("POST /api/conversations failed:", error)
    return NextResponse.json({ success: false, error: "Failed to create conversation" }, { status: 500 })
  }
}
