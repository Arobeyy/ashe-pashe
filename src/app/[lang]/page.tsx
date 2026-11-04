import { Suspense } from "react"
import { getDictionary } from "./dictionaries"
import { getListings } from "@/lib/listings"
import { getSession } from "@/lib/auth"
import { FeedContainer } from "@/components/feed/FeedContainer"
import { FeedSkeleton } from "@/components/feed/FeedSkeleton"

async function FeedContent({ lang }: { lang: string }) {
  const [dict, session] = await Promise.all([
    getDictionary(lang),
    getSession(),
  ])

  // Fetches initial listings page via direct DB call in Server Component
  const result = await getListings({
    sort: "newest",
    page: 1,
    limit: 12,
    currentUserId: session?.userId,
  })

  return (
    <FeedContainer
      initialListings={result.listings}
      initialTotal={result.total}
      initialHasMore={result.hasMore}
      lang={lang}
      dict={dict}
    />
  )
}

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
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
        <FeedContent lang={lang} />
      </Suspense>
    </div>
  )
}
