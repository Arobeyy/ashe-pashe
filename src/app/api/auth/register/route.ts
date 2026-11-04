import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth"
import type { ApiResponse, UserPublic } from "@/types"

type RegisterRequestBody = {
  name: string
  email: string
  password: string
  phone?: string
  occupation?: string
  education?: string
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<UserPublic>>> {
  try {
    const body: RegisterRequestBody = await request.json()
    const { name, email, password, phone, occupation, education } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required" },
        { status: 400 },
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 },
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email is already registered" },
        { status: 409 },
      )
    }

    const passwordHash = await hashPassword(password)
    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        phone: phone?.trim() || null,
        occupation: occupation?.trim() || "Student",
        education: education?.trim() || null,
        role: "USER",
      },
    })

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
      _count: {
        listings: 0,
        savedListings: 0,
        comments: 0,
      },
    }

    return NextResponse.json({ success: true, data: userPublic }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

