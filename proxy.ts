import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const locales = ["en", "bn"] as const
type Locale = (typeof locales)[number]
const defaultLocale: Locale = "en"

function getLocale(request: NextRequest): Locale {
  const acceptLanguage = request.headers.get("accept-language") ?? ""
  const preferred = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=")
      return { tag: tag.trim().toLowerCase(), q: q ? parseFloat(q) : 1 }
    })
    .sort((a, b) => b.q - a.q)
    .map(({ tag }) => tag)

  for (const tag of preferred) {
    if (locales.includes(tag as Locale)) return tag as Locale
    const base = tag.split("-")[0] as Locale
    if (locales.includes(base)) return base
  }
  return defaultLocale
}

async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get("token")?.value
  if (!token) return null
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "super-secret-dev-key-change-in-production-min-32-chars",
    )
    const { payload } = await jwtVerify(token, secret)
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as "USER" | "ADMIN",
    }
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ignore static assets, next internals, and uploaded files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/uploads") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // Handle API route authorization
  if (pathname.startsWith("/api/")) {
    const user = await verifyAuth(request)

    // Protected API routes requiring standard authentication
    const isProtectedApi =
      (pathname === "/api/listings" && request.method === "POST") ||
      (pathname.startsWith("/api/listings/") && pathname.endsWith("/status") && request.method === "PATCH") ||
      (pathname.startsWith("/api/listings/") && request.method === "DELETE") ||
      (pathname.includes("/comments") && (request.method === "POST" || request.method === "DELETE")) ||
      (pathname.startsWith("/api/reports") && (request.method === "POST" || request.method === "GET" || request.method === "PATCH")) ||
      pathname.startsWith("/api/saved") ||
      pathname.startsWith("/api/conversations") ||
      (pathname.startsWith("/api/users/") && request.method === "PATCH") ||
      pathname.startsWith("/api/upload")

    if (isProtectedApi && !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      )
    }

    // Admin-only API routes
    const isAdminApi =
      (pathname === "/api/reports" && request.method === "GET") ||
      (pathname.startsWith("/api/reports") && request.method === "PATCH") ||
      pathname.startsWith("/api/admin")

    if (isAdminApi && (!user || user.role !== "ADMIN")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      )
    }

    return NextResponse.next()
  }

  // Ensure path starts with valid locale prefix
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  )

  if (!pathnameHasLocale) {
    const locale = getLocale(request)
    request.nextUrl.pathname = `/${locale}${pathname}`
    return NextResponse.redirect(request.nextUrl)
  }

  // Handle protected page routes
  const segments = pathname.split("/").filter(Boolean)
  const currentLocale = segments[0]
  const pageRoute = "/" + segments.slice(1).join("/")

  const isProtectedPage =
    pageRoute === "/post" ||
    pageRoute === "/saved" ||
    pageRoute.startsWith("/messages") ||
    pageRoute === "/profile/edit"

  const user = await verifyAuth(request)

  // Redirects authenticated users away from login or register
  const isAuthPage = pageRoute === "/login" || pageRoute === "/register"
  if (isAuthPage && user) {
    const from = request.nextUrl.searchParams.get("from")
    const destination = from && from.startsWith(`/${currentLocale}`) ? from : `/${currentLocale}`
    return NextResponse.redirect(new URL(destination, request.url))
  }

  if (isProtectedPage && !user) {
    const loginUrl = new URL(`/${currentLocale}/login`, request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Guard admin pages against non-admin users
  if (pageRoute.startsWith("/admin")) {
    if (!user) {
      const loginUrl = new URL(`/${currentLocale}/login`, request.url)
      loginUrl.searchParams.set("from", pathname)
      return NextResponse.redirect(loginUrl)
    }
    if (user.role !== "ADMIN") {
      return NextResponse.redirect(new URL(`/${currentLocale}`, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
