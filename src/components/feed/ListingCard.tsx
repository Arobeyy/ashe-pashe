"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  MapPin,
  Calendar,
  Home,
  MessageSquare,
  Bookmark,
  Share2,
  ChevronDown,
  ShieldAlert,
  Check,
  Building2,
  MoreVertical,
  Compass,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ActionGate } from "@/components/auth/ActionGate"
import { cn } from "@/lib/utils"
import type { ListingCard as ListingCardType } from "@/types"
import type { Dictionary } from "@/app/[lang]/dictionaries"

type ListingCardProps = {
  listing: ListingCardType
  lang: string
  dict: Dictionary
  viewMode?: "grid" | "feed"
  onSaveToggle?: (listingId: string, saved: boolean) => void
}

function formatRelativeTime(dateString: string, lang: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return lang === "bn" ? "এইমাত্র" : "Just now"
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return lang === "bn" ? `${diffInMinutes} মিনিট আগে` : `${diffInMinutes}m ago`
  }
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return lang === "bn" ? `${diffInHours} ঘণ্টা আগে` : `${diffInHours}h ago`
  }
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return lang === "bn" ? `${diffInDays} দিন আগে` : `${diffInDays}d ago`
  }
  return date.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", {
    month: "short",
    day: "numeric",
  })
}

function formatAvailableDate(dateString: string, lang: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function ListingCard({
  listing,
  lang,
  dict,
  viewMode = "grid",
  onSaveToggle,
}: ListingCardProps) {
  const [isFlatInfoOpen, setIsFlatInfoOpen] = React.useState(false)
  const [isSaved, setIsSaved] = React.useState(Boolean(listing.isSaved))
  const [savedCount, setSavedCount] = React.useState(listing.savedCount ?? 0)
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  const photos = listing.photos || []
  const hasPhotos = photos.length > 0
  const primaryPhoto = photos[0]
  const detailUrl = `/${lang}/listings/${listing.id}`

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isMenuOpen])

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsMenuOpen(false)
    const fullUrl = `${window.location.origin}${detailUrl}`
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSave = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setIsMenuOpen(false)

    // Optimistic state toggle
    const nextSaved = !isSaved
    setIsSaved(nextSaved)
    setSavedCount((prev) => (nextSaved ? prev + 1 : Math.max(0, prev - 1)))
    if (onSaveToggle) onSaveToggle(listing.id, nextSaved)

    try {
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      })
      if (!res.ok) {
        setIsSaved(!nextSaved)
        setSavedCount((prev) => (!nextSaved ? prev + 1 : Math.max(0, prev - 1)))
      }
    } catch {
      setIsSaved(!nextSaved)
      setSavedCount((prev) => (!nextSaved ? prev + 1 : Math.max(0, prev - 1)))
    }
  }

  const typeLabel =
    dict?.listing?.types?.[listing.accommodationType] ?? listing.accommodationType
  const genderLabel =
    dict?.listing?.genders?.[listing.genderPreference] ?? listing.genderPreference
  const tenantLabel =
    dict?.listing?.tenants?.[listing.tenantType] ?? listing.tenantType

  const hasFlatInfo =
    Boolean(listing.totalRooms) ||
    Boolean(listing.totalWashrooms) ||
    Boolean(listing.balconies) ||
    Boolean(listing.floorLevel)

  const isAvailable = listing.availabilityStatus === "AVAILABLE"

  return (
    <article className="group flex flex-col rounded-xl border border-border bg-card text-card-foreground shadow-xs transition-shadow hover:shadow-md overflow-hidden">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50 gap-3">
        <Link
          href={`/${lang}/profile/${listing.ownerId}`}
          className="flex items-center gap-2.5 min-w-0 group/author"
        >
          <Avatar size="sm">
            {listing.owner?.avatarUrl ? (
              <AvatarImage
                src={listing.owner.avatarUrl}
                alt={listing.owner.name || "Owner"}
              />
            ) : null}
            <AvatarFallback>
              {(listing.owner?.name || "U").slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="truncate text-xs font-semibold text-foreground group-hover/author:text-primary transition-colors">
              {listing.owner?.name || dict?.listing?.postedBy || "Community Member"}
            </span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{listing.area}</span>
              <span>•</span>
              <span className="shrink-0">
                {formatRelativeTime(listing.createdAt, lang)}
              </span>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant={isAvailable ? "default" : "secondary"}
            className={cn(
              "text-xs px-2 py-0.5",
              isAvailable
                ? "bg-primary/90 text-primary-foreground font-medium"
                : "bg-muted text-muted-foreground",
            )}
          >
            {isAvailable
              ? dict?.listing?.available ?? "Available"
              : dict?.listing?.rented ?? "Rented"}
          </Badge>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label={dict?.listing?.options ?? "Options"}
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <MoreVertical className="size-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-9 z-30 w-44 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg">
                <ActionGate returnUrl={detailUrl}>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-left hover:bg-accent transition-colors"
                  >
                    <Bookmark
                      className={cn("size-3.5", isSaved && "fill-current text-primary")}
                    />
                    <span>
                      {isSaved
                        ? dict?.listing?.saved ?? "Saved"
                        : dict?.listing?.save ?? "Save"}
                    </span>
                  </button>
                </ActionGate>

                <button
                  type="button"
                  onClick={handleShare}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-left hover:bg-accent transition-colors"
                >
                  <Share2 className="size-3.5" />
                  <span>{dict?.listing?.share ?? "Share"}</span>
                </button>

                <Link
                  href={`${detailUrl}#report`}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-left text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <ShieldAlert className="size-3.5" />
                  <span>{dict?.listing?.report ?? "Report"}</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="relative aspect-video w-full bg-muted overflow-hidden select-none">
        {hasPhotos ? (
          <>
            <Link href={detailUrl} className="block relative w-full h-full">
              <Image
                src={primaryPhoto.imageUrl}
                alt={listing.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-102"
                priority={false}
              />
            </Link>

            {photos.length > 1 && (
              <div className="absolute bottom-2.5 left-2.5 rounded-full bg-background/85 px-2 py-0.5 text-xs font-semibold text-foreground backdrop-blur shadow-xs pointer-events-none">
                1/{photos.length}
              </div>
            )}
          </>
        ) : (
          <Link
            href={detailUrl}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            <Home className="size-10 stroke-1" />
            <span className="text-xs font-medium">Ashepashe Housing</span>
          </Link>
        )}

        {copied && (
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-1 text-xs shadow-md animate-in fade-in zoom-in-95">
            <Check className="size-3.5" />
            <span>{dict?.listing?.linkCopied ?? "Link copied!"}</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 space-y-3">
        <div>
          <Link
            href={detailUrl}
            className="font-heading font-semibold text-base leading-snug text-foreground hover:text-primary transition-colors line-clamp-2"
          >
            {listing.title}
          </Link>

          <div className="flex items-baseline gap-2 mt-1.5 flex-wrap">
            <span className="text-lg font-bold text-foreground">
              ৳ {listing.monthlyRent.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">
              {dict?.listing?.perMonth ?? "/ month"}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground font-medium">
              {listing.billsIncluded
                ? dict?.listing?.billsIncluded ?? "Bills included"
                : dict?.listing?.billsExcluded ?? "+ Bills"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground line-clamp-1">
            <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{listing.address}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-xs font-normal">
            {typeLabel}
          </Badge>
          <Badge variant="outline" className="text-xs font-normal">
            {genderLabel}
          </Badge>
          {listing.tenantType !== "ANY" && (
            <Badge variant="outline" className="text-xs font-normal">
              {tenantLabel}
            </Badge>
          )}
          <Badge
            variant="secondary"
            className="text-xs font-normal flex items-center gap-1"
          >
            <Calendar className="size-3" />
            <span>
              {dict?.listing?.availableFrom ?? "Available"}:{" "}
              {formatAvailableDate(listing.availableFrom, lang)}
            </span>
          </Badge>
          {typeof listing.distanceKm === "number" && (
            <Badge
              variant="secondary"
              className="text-xs font-normal flex items-center gap-1"
            >
              <Compass className="size-3 text-primary" />
              <span>
                {listing.distanceKm}{" "}
                {dict?.listing?.distanceKm
                  ? dict.listing.distanceKm.replace("{distance}", "")
                  : "km away"}
              </span>
            </Badge>
          )}
        </div>

        {hasFlatInfo && (
          <div className="rounded-lg border border-border/70 bg-muted/30 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setIsFlatInfoOpen((prev) => !prev)}
              className="flex w-full items-center justify-between px-3 py-2 font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Building2 className="size-3.5 text-muted-foreground" />
                <span>{dict?.listing?.flatInfo ?? "Flat Information"}</span>
              </span>
              <ChevronDown
                className={cn(
                  "size-3.5 text-muted-foreground transition-transform duration-200",
                  isFlatInfoOpen && "rotate-180",
                )}
              />
            </button>
            {isFlatInfoOpen && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-3 pb-2.5 pt-1 border-t border-border/40 text-muted-foreground">
                {typeof listing.totalRooms === "number" && (
                  <div>
                    <span className="font-medium text-foreground">
                      {dict?.listing?.rooms ?? "Rooms"}:
                    </span>{" "}
                    {listing.totalRooms}
                  </div>
                )}
                {typeof listing.floorLevel === "number" && (
                  <div>
                    <span className="font-medium text-foreground">
                      {dict?.listing?.floor ?? "Floor"}:
                    </span>{" "}
                    {listing.floorLevel}
                  </div>
                )}
                {typeof listing.totalWashrooms === "number" && (
                  <div>
                    <span className="font-medium text-foreground">
                      {dict?.listing?.washrooms ?? "Washrooms"}:
                    </span>{" "}
                    {listing.totalWashrooms}
                  </div>
                )}
                {typeof listing.balconies === "number" && (
                  <div>
                    <span className="font-medium text-foreground">
                      {dict?.listing?.balconies ?? "Balconies"}:
                    </span>{" "}
                    {listing.balconies}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {listing.facilities && listing.facilities.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {listing.facilities.slice(0, 4).map((f) => (
              <span
                key={f}
                className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground font-medium capitalize"
              >
                {f}
              </span>
            ))}
            {listing.facilities.length > 4 && (
              <span className="text-xs text-muted-foreground">
                +{listing.facilities.length - 4} more
              </span>
            )}
          </div>
        )}

        {listing.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {listing.description}
          </p>
        )}

        <footer className="mt-auto flex items-center justify-between pt-3 border-t border-border/60">
          <Link
            href={`${detailUrl}#comments`}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            <MessageSquare className="size-3.5" />
            <span>
              {listing.commentsCount ?? 0} {dict?.listing?.comments ?? "comments"}
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleShare}
              title={dict?.listing?.share ?? "Share"}
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Share2 className="size-4" />
            </button>

            <ActionGate returnUrl={detailUrl}>
              <button
                type="button"
                onClick={handleSave}
                title={
                  isSaved
                    ? dict?.listing?.saved ?? "Saved"
                    : dict?.listing?.save ?? "Save"
                }
                className={cn(
                  "flex size-8 items-center justify-center rounded-md transition-colors",
                  isSaved
                    ? "text-primary hover:bg-primary/10"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Bookmark
                  className={cn("size-4", isSaved && "fill-current text-primary")}
                />
              </button>
            </ActionGate>
          </div>
        </footer>
      </div>
    </article>
  )
}

