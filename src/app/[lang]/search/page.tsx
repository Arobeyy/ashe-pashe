import { Suspense } from "react"
import { getDictionary } from "../dictionaries"
import { getListings } from "@/lib/listings"
import { getSession } from "@/lib/auth"
import { SearchContainer } from "@/components/search/SearchContainer"
import { FeedSkeleton } from "@/components/feed/FeedSkeleton"
import type { AccommodationType, GenderPreference, SortOption, TenantType } from "@/types"
import type { SearchFilterState } from "@/components/search/FilterControls"

type SearchPageProps = {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

function parseNumber(value: string | string[] | undefined): number | undefined {
  if (!value || Array.isArray(value)) return undefined
  const num = Number(value)
  return isNaN(num) ? undefined : num
}

function parseString(value: string | string[] | undefined): string | undefined {
  if (!value || Array.isArray(value)) return undefined
  return value.trim() || undefined
}

async function SearchContent({
  lang,
  searchParamsPromise,
}: {
  lang: string
  searchParamsPromise: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const [dict, session, rawSearchParams] = await Promise.all([
    getDictionary(lang),
    getSession(),
    searchParamsPromise,
  ])

  const lat = parseNumber(rawSearchParams.lat)
  const lng = parseNumber(rawSearchParams.lng)
  const radius = parseNumber(rawSearchParams.radius) ?? 3.0
  const minRent = parseNumber(rawSearchParams.minRent)
  const maxRent = parseNumber(rawSearchParams.maxRent)
  const type = parseString(rawSearchParams.type) as AccommodationType | undefined
  const genderPreference = parseString(rawSearchParams.genderPreference) as GenderPreference | undefined
  const tenantType = parseString(rawSearchParams.tenantType) as TenantType | undefined
  const q = parseString(rawSearchParams.q)
  const area = parseString(rawSearchParams.area)
  const sort = (parseString(rawSearchParams.sort) as SortOption) || "newest"

  // Directly executes query logic server-side for fast initial SSR render
  const result = await getListings({
    lat,
    lng,
    radius,
    minRent,
    maxRent,
    type,
    genderPreference,
    tenantType,
    q,
    area,
    sort,
    page: 1,
    limit: 12,
    currentUserId: session?.userId,
  })

  const initialFilters: SearchFilterState = {
    q: q || "",
    area: area || "",
    minRent: minRent !== undefined ? minRent.toString() : "",
    maxRent: maxRent !== undefined ? maxRent.toString() : "",
    type,
    genderPreference,
    tenantType,
    radius,
    lat,
    lng,
  }

  return (
    <SearchContainer
      initialListings={result.listings}
      initialTotal={result.total}
      initialHasMore={result.hasMore}
      initialFilters={initialFilters}
      initialSort={sort}
      lang={lang}
      dict={dict}
    />
  )
}

export default async function SearchPage({
  params,
  searchParams,
}: SearchPageProps) {
  const { lang } = await params

  return (
    <div className="flex flex-col flex-1 bg-background font-sans">
      <Suspense
        fallback={
          <div className="max-w-7xl mx-auto px-4 py-8 w-full">
            <FeedSkeleton />
          </div>
        }
      >
        <SearchContent lang={lang} searchParamsPromise={searchParams} />
      </Suspense>
    </div>
  )
}
