import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import type { ApiResponse } from "@/types"

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<{ unreadCount: number }>>> {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ success: true, data: { unreadCount: 0 } })
    }

    const unreadCount = await db.message.count({
      where: {
        conversation: {
          OR: [{ user1Id: session.userId }, { user2Id: session.userId }],
        },
        senderId: { not: session.userId },
        isRead: false,
      },
    })

    return NextResponse.json({ success: true, data: { unreadCount } })
  } catch (error) {
    console.error("GET /api/conversations/unread-count failed:", error)
    return NextResponse.json({ success: false, error: "Failed to retrieve unread count" }, { status: 500 })
  }
}
