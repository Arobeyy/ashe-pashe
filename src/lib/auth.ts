import { SignJWT, jwtVerify } from "jose"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import type { AuthTokenPayload } from "@/types"

export const COOKIE_NAME = "token"

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "super-secret-dev-key-change-in-production-min-32-chars"
  return new TextEncoder().encode(secret)
}

// Signs a 7-day expiration JWT for the user payload
export async function signToken(payload: AuthTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret())
}

// Verifies a JWT token string and returns parsed user payload
export async function verifyToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as AuthTokenPayload["role"],
    }
  } catch {
    return null
  }
}

// Retrieves and verifies user session from incoming request or store cookies
export async function getSession(request?: Request): Promise<AuthTokenPayload | null> {
  if (request) {
    const cookieHeader = request.headers.get("cookie")
    if (cookieHeader) {
      const token = cookieHeader
        .split(";")
        .map((s) => s.trim())
        .find((s) => s.startsWith(`${COOKIE_NAME}=`))
        ?.substring(`${COOKIE_NAME}=`.length)
      if (token) return verifyToken(token)
    }
  }
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null
    return verifyToken(token)
  } catch {
    return null
  }
}

type CookieSetOptions = {
  httpOnly?: boolean
  sameSite?: "lax" | "strict" | "none" | boolean
  secure?: boolean
  path?: string
  maxAge?: number
}

type CookieCapableResponse = {
  cookies: {
    set: (name: string, value: string, options?: CookieSetOptions) => void
    delete?: (name: string) => void
  }
}

// Sets HttpOnly auth cookie for session token
export async function setAuthCookie(token: string, response?: CookieCapableResponse): Promise<void> {
  if (response?.cookies) {
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
    return
  }
  try {
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
  } catch {
    // Graceful fallback when outside async cookies context
  }
}

// Clears auth session cookie
export async function clearAuthCookie(response?: CookieCapableResponse): Promise<void> {
  if (response?.cookies?.delete) {
    response.cookies.delete(COOKIE_NAME)
    return
  }
  try {
    const cookieStore = await cookies()
    cookieStore.delete(COOKIE_NAME)
  } catch {
    // Graceful fallback when outside async cookies context
  }
}

// Hashes plaintext password with salt rounds
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// Compares plaintext password against bcrypt hash
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

