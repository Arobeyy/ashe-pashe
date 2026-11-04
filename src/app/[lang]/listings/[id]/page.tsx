import { Suspense } from "react"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getDictionary } from "../../dictionaries"
import { getListingById } from "@/lib/listings"
import { getSession } from "@/lib/auth"
import { ListingDetailContainer } from "@/components/listing/ListingDetailContainer"
import ListingDetailLoading from "./loading"

type ListingPageProps = {
  params: Promise<{
    lang: string
    id: string
  }>
}

export async function generateMetadata({
  params,
}: ListingPageProps): Promise<Metadata> {
  const { id } = await params
  const listing = await getListingById(id)

  if (!listing) {
    return {
      title: "Listing Not Found — Ashepashe",
    }
  }

  const rent = listing.monthlyRent.toLocaleString()
  return {
    title: `${listing.title} — ৳${rent}/mo in ${listing.area} | Ashepashe`,
    description: `${listing.description.slice(0, 160)}... Located in ${listing.area}, Dhaka.`,
  }
}

async function ListingDetailContent({
  lang,
  id,
}: {
  lang: string
  id: string
}) {
  const [dict, session] = await Promise.all([
    getDictionary(lang),
    getSession(),
  ])

  // Calls DB helper directly inside Server Component without HTTP fetch overhead
  const listing = await getListingById(id, session?.userId)

  if (!listing) {
    notFound()
  }

  return (
    <ListingDetailContainer
      listing={listing}
      currentUserId={session?.userId}
      currentUserRole={session?.role}
      lang={lang}
      dict={dict}
    />
  )
}

export default async function ListingDetailPage({ params }: ListingPageProps) {
  const { lang, id } = await params

  return (
    <main className="min-h-screen bg-background">
      <Suspense fallback={<ListingDetailLoading />}>
        <ListingDetailContent lang={lang} id={id} />
      </Suspense>
    </main>
  )
}

