"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { ExternalLink, Home, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ConversationSnippetListing } from "@/types"
import type { Dictionary } from "@/app/[lang]/dictionaries"

type ListingContextCardProps = {
  listing: ConversationSnippetListing
  lang: string
  dict: Dictionary
}

export function ListingContextCard({ listing, lang, dict }: ListingContextCardProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  return (
    <div className="border-b border-border bg-card/80 backdrop-blur-xs px-4 py-2.5 transition-all">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/${lang}/listings/${listing.id}`}
          className="flex items-center gap-3 min-w-0 flex-1 group"
        >
          <div className="relative size-12 shrink-0 rounded-lg overflow-hidden bg-muted border border-border">
            {listing.imageUrl ? (
              <Image
                src={listing.imageUrl}
                alt={listing.title}
                fill
                sizes="48px"
                className="object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <Home className="size-5" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider block">
              {dict.messages?.regardingListing ?? "Inquiry about"}
            </span>
            <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {listing.title}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-bold text-foreground">৳{listing.monthlyRent.toLocaleString()}</span>
              <span>•</span>
              <span className="truncate">{listing.area}</span>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-1.5 shrink-0">
          <Link href={`/${lang}/listings/${listing.id}`}>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs font-semibold rounded-lg gap-1 border-border"
            >
              <span>{dict.messages?.viewListing ?? "View Listing"}</span>
              <ExternalLink className="size-3" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
