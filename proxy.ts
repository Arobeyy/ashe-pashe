import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Keep in sync with src/app/[lang]/dictionaries.ts
const locales = ['en', 'bn'] as const
type Locale = (typeof locales)[number]
const defaultLocale: Locale = 'en'

function getLocale(request: NextRequest): Locale {
  const acceptLanguage = request.headers.get('accept-language') ?? ''

  const preferred = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=')
      return { tag: tag.trim().toLowerCase(), q: q ? parseFloat(q) : 1 }
    })
    .sort((a, b) => b.q - a.q)
    .map(({ tag }) => tag)

  for (const tag of preferred) {
    if (locales.includes(tag as Locale)) return tag as Locale
    const base = tag.split('-')[0] as Locale
    if (locales.includes(base)) return base
  }

  return defaultLocale
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  )
  if (pathnameHasLocale) return

  const locale = getLocale(request)
  request.nextUrl.pathname = `/${locale}${pathname}`
  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
