import * as React from "react"
import Link from "next/link"
import { Home, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Dictionary } from "@/app/[lang]/dictionaries"

type FeedEmptyStateProps = {
  lang: string
  dict: Dictionary
  onReset?: () => void
}

export function FeedEmptyState({ lang, dict, onReset }: FeedEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-8 md:p-12 text-center my-6">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
        <Home className="size-7" />
      </div>

      <h3 className="font-heading text-lg font-semibold text-foreground">
        {dict?.feed?.noListings ?? "No listings found"}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        {dict?.feed?.noListingsDesc ??
          "Be the first one to post a listing or try adjusting your filters."}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
        <Link href={`/${lang}/post`}>
          <Button className="flex items-center gap-2">
            <PlusCircle className="size-4" />
            <span>{dict?.feed?.postListing ?? "Post a Listing"}</span>
          </Button>
        </Link>

        {onReset && (
          <Button variant="outline" onClick={onReset}>
            {dict?.feed?.all ?? "Show All"}
          </Button>
        )}
      </div>
    </div>
  )
}

