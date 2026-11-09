import { db } from "@/lib/db"
import type { ConversationSummary } from "@/types"

export async function getUserConversations(userId: string): Promise<ConversationSummary[]> {
  const conversations = await db.conversation.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    orderBy: { lastMessageAt: "desc" },
    include: {
      user1: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          occupation: true,
        },
      },
      user2: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          occupation: true,
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
        take: 1,
        orderBy: { createdAt: "desc" },
        select: {
          content: true,
          photoUrl: true,
          createdAt: true,
          senderId: true,
          isRead: true,
        },
      },
    },
  })

  return Promise.all(
    conversations.map(async (conv) => {
      const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1
      const unreadCount = await db.message.count({
        where: {
          conversationId: conv.id,
          senderId: { not: userId },
          isRead: false,
        },
      })

      const lastMessage = conv.messages[0]
        ? {
            content: conv.messages[0].content,
            photoUrl: conv.messages[0].photoUrl,
            createdAt: conv.messages[0].createdAt.toISOString(),
            senderId: conv.messages[0].senderId,
            isRead: conv.messages[0].isRead,
          }
        : null

      return {
        id: conv.id,
        otherUser,
        listing: conv.listing
          ? {
              id: conv.listing.id,
              title: conv.listing.title,
              monthlyRent: conv.listing.monthlyRent,
              area: conv.listing.area,
              imageUrl: conv.listing.photos[0]?.imageUrl ?? null,
            }
          : null,
        lastMessage,
        unreadCount,
        updatedAt: conv.lastMessageAt.toISOString(),
      }
    }),
  )
}
