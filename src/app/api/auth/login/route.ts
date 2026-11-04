import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { comparePassword, signToken, setAuthCookie } from "@/lib/auth"
import type { ApiResponse, UserPublic } from "@/types"

type LoginRequestBody = {
  email: string
  password: string
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<UserPublic>>> {
  try {
    const body: LoginRequestBody = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 },
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
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
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 },
      )
    }

    const validPassword = await comparePassword(password, user.passwordHash)
    if (!validPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 },
      )
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role as "USER" | "ADMIN",
    })

    await setAuthCookie(token)

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
      interests: JSON.parse(user.interests || "[]"),
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

