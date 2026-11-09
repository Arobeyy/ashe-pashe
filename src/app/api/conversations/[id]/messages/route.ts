import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import type { ApiResponse, MessageItem } from "@/types"
import path from "path"
import { writeFile, mkdir } from "fs/promises"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse<ApiResponse<MessageItem>>> {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const conversation = await db.conversation.findUnique({
      where: { id },
      select: { id: true, user1Id: true, user2Id: true },
    })

    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 })
    }

    if (conversation.user1Id !== session.userId && conversation.user2Id !== session.userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const contentType = request.headers.get("content-type") || ""
    let content = ""
    let photoUrl: string | null = null

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      content = formData.get("content")?.toString().trim() || ""
      const file = formData.get("photo")

      if (file instanceof File && file.size > 0) {
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg"
        const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(extension) ? extension : "jpg"
        const filename = `${Date.now()}-${crypto.randomUUID()}.${safeExt}`
        const uploadsDir = path.join(process.cwd(), "public", "uploads", "messages")
        await mkdir(uploadsDir, { recursive: true })
        const buffer = Buffer.from(await file.arrayBuffer())
        await writeFile(path.join(uploadsDir, filename), buffer)
        photoUrl = `/uploads/messages/${filename}`
      }
    } else {
      const body = await request.json().catch(() => null)
      if (body) {
        content = typeof body.content === "string" ? body.content.trim() : ""
        photoUrl = typeof body.photoUrl === "string" ? body.photoUrl.trim() : null
      }
    }

    if (!content && !photoUrl) {
      return NextResponse.json(
        { success: false, error: "Message must contain text or a photo" },
        { status: 400 },
      )
    }

    const message = await db.message.create({
      data: {
        conversationId: id,
        senderId: session.userId,
        content,
        photoUrl,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    })

    await db.conversation.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    })

    const messageItem: MessageItem = {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      photoUrl: message.photoUrl,
      isRead: message.isRead,
      createdAt: message.createdAt.toISOString(),
      sender: message.sender,
    }

    return NextResponse.json({ success: true, data: messageItem })
  } catch (error) {
    console.error("POST /api/conversations/[id]/messages failed:", error)
    return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 })
  }
}
