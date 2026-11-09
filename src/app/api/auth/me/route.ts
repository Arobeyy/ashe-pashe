import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import type { ApiResponse, UserPublic } from "@/types"

export async function GET(request?: NextRequest): Promise<NextResponse<ApiResponse<UserPublic | null>>> {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ success: true, data: null })
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      include: {
        _count: {
          select: {
            listings: true,
            savedListings: true,
            comments: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ success: true, data: null })
    }

    let parsedInterests: string[] = []
    try {
      const parsed = JSON.parse(user.interests || "[]")
      if (Array.isArray(parsed)) {
        parsedInterests = parsed.map((item) => String(item).trim()).filter(Boolean)
      }
    } catch {
      parsedInterests = []
    }

    const userPublic: UserPublic = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      coverUrl: user.coverUrl,
      occupation: user.occupation,
      education: user.education,
      location: user.location,
      bio: user.bio,
      interests: parsedInterests,
      role: user.role as "USER" | "ADMIN",
      createdAt: user.createdAt.toISOString(),
      _count: user._count,
    }

    return NextResponse.json({ success: true, data: userPublic })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
