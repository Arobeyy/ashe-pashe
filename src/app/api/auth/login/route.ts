import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { comparePassword, signToken, setAuthCookie } from "@/lib/auth"
import type { ApiResponse, UserPublic } from "@/types"

type LoginRequestBody = {
  email: string
  password: string
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<UserPublic>>> {
  try {
    let body: LoginRequestBody
    try {
      body = (await request.json()) as LoginRequestBody
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 })
    }

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

    const response = NextResponse.json({ success: true, data: userPublic })
    await setAuthCookie(token, response)
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
