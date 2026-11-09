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
      showContactInfo: user.showContactInfo,
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

export async function PATCH(request: NextRequest): Promise<NextResponse<ApiResponse<UserPublic>>> {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as Partial<UserPublic>
    const { showContactInfo, phone, occupation, education, bio, location } = body

    const updated = await db.user.update({
      where: { id: session.userId },
      data: {
        ...(typeof showContactInfo === "boolean" && { showContactInfo }),
        ...(typeof phone === "string" && { phone: phone.trim() }),
        ...(typeof occupation === "string" && { occupation: occupation.trim() }),
        ...(typeof education === "string" && { education: education.trim() }),
        ...(typeof bio === "string" && { bio: bio.trim() }),
        ...(typeof location === "string" && { location: location.trim() }),
      },
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

    let parsedInterests: string[] = []
    try {
      const parsed = JSON.parse(updated.interests || "[]")
      if (Array.isArray(parsed)) {
        parsedInterests = parsed.map((item) => String(item).trim()).filter(Boolean)
      }
    } catch {
      parsedInterests = []
    }

    const userPublic: UserPublic = {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      avatarUrl: updated.avatarUrl,
      coverUrl: updated.coverUrl,
      occupation: updated.occupation,
      education: updated.education,
      location: updated.location,
      bio: updated.bio,
      interests: parsedInterests,
      showContactInfo: updated.showContactInfo,
      role: updated.role as "USER" | "ADMIN",
      createdAt: updated.createdAt.toISOString(),
      _count: updated._count,
    }

    return NextResponse.json({ success: true, data: userPublic })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
