"use client"

import * as React from "react"
import Link from "next/link"
import {
  LayoutGrid,
  SquareDashedKanban,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Loader2,
  Sparkles,
  Compass,
} from "lucide-react"
import { ListingCard } from "@/components/feed/ListingCard"
import { FeedSkeleton } from "@/components/feed/FeedSkeleton"
import { FeedEmptyState } from "@/components/feed/FeedEmptyState"
import { cn } from "@/lib/utils"
import type { AccommodationType, ApiResponse, ListingCard as ListingCardType, SortOption } from "@/types"
import type { Dictionary } from "@/app/[lang]/dictionaries"

type FeedContainerProps = {
  initialListings: ListingCardType[]
  initialTotal: number
  initialHasMore: boolean
  lang: string
  dict: Dictionary
}

type FilterType = "ALL" | AccommodationType

export function FeedContainer({
  initialListings,
  initialTotal,
  initialHasMore,
  lang,
  dict,
}: FeedContainerProps) {
  const [listings, setListings] = React.useState<ListingCardType[]>(initialListings)
  const [typeFilter, setTypeFilter] = React.useState<FilterType>("ALL")
  const [sortOption, setSortOption] = React.useState<SortOption>("newest")
  const [viewMode, setViewMode] = React.useState<"grid" | "feed">("grid")
  const [page, setPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(initialHasMore)
  const [total, setTotal] = React.useState(initialTotal)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const [isRefetching, setIsRefetching] = React.useState(false)
  const [isSortOpen, setIsSortOpen] = React.useState(false)
  const [userLocation, setUserLocation] = React.useState<{ lat: number; lng: number } | null>(null)
  const [isLocating, setIsLocating] = React.useState(false)
  const sortRef = React.useRef<HTMLDivElement>(null)
  const sentinelRef = React.useRef<HTMLDivElement>(null)
  const isFetchingNextRef = React.useRef(false)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false)
      }
    }
    if (isSortOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isSortOpen])

  // Refetches list when type filter, sort option, or location changes
  const handleFilterOrSortChange = React.useCallback(
    async (
      newType: FilterType,
      newSort: SortOption,
      locOverride?: { lat: number; lng: number } | null,
    ) => {
      setIsRefetching(true)
      try {
        const loc = locOverride !== undefined ? locOverride : userLocation
        const params = new URLSearchParams()
        if (newType !== "ALL") params.set("type", newType)
        params.set("sort", newSort)
        params.set("page", "1")
        params.set("limit", "12")
        if (loc) {
          params.set("lat", String(loc.lat))
          params.set("lng", String(loc.lng))
          params.set("radius", "3")
        }

        const res = await fetch(`/api/listings?${params.toString()}`)
        const json = (await res.json()) as ApiResponse<ListingCardType[]>

        if (json.success && json.data) {
          setListings(json.data)
          setPage(1)
          setTotal(json.pagination?.total ?? json.data.length)
          setHasMore(Boolean(json.pagination?.hasMore))
        }
      } catch (err) {
        console.error("Failed to refetch listings", err)
      } finally {
        setIsRefetching(false)
      }
    },
    [userLocation],
  )

  const onTypeSelect = (type: FilterType) => {
    if (type === typeFilter) return
    setTypeFilter(type)
    void handleFilterOrSortChange(type, sortOption)
  }

  const onSortSelect = (sort: SortOption) => {
    setIsSortOpen(false)
    if (sort === sortOption) return
    setSortOption(sort)
    void handleFilterOrSortChange(typeFilter, sort)
  }

  // Requests user GPS and filters by nearest within 3 km radius
  const toggleNearMe = () => {
    if (userLocation) {
      setUserLocation(null)
      setSortOption("newest")
      void handleFilterOrSortChange(typeFilter, "newest", null)
      return
    }
    if (!navigator.geolocation) return
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false)
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        setSortOption("nearest")
        void handleFilterOrSortChange(typeFilter, "nearest", loc)
      },
      () => {
        setIsLocating(false)
      },
      { timeout: 10000, enableHighAccuracy: true },
    )
  }

  // Fetches next page of listings and appends to feed
  const handleLoadMore = React.useCallback(async () => {
    if (isFetchingNextRef.current || !hasMore) return
    isFetchingNextRef.current = true
    setIsLoadingMore(true)
    const nextPage = page + 1

    try {
      const params = new URLSearchParams()
      if (typeFilter !== "ALL") params.set("type", typeFilter)
      params.set("sort", sortOption)
      params.set("page", String(nextPage))
      params.set("limit", "12")
      if (userLocation) {
        params.set("lat", String(userLocation.lat))
        params.set("lng", String(userLocation.lng))
        params.set("radius", "3")
      }

      const res = await fetch(`/api/listings?${params.toString()}`)
      const json = (await res.json()) as ApiResponse<ListingCardType[]>

      if (json.success && json.data) {
        setListings((prev) => [...prev, ...(json.data || [])])
        setPage(nextPage)
        setHasMore(Boolean(json.pagination?.hasMore))
      }
    } catch (err) {
      console.error("Failed to load more listings", err)
    } finally {
      setIsLoadingMore(false)
      isFetchingNextRef.current = false
    }
  }, [hasMore, page, typeFilter, sortOption, userLocation])

  // Observes sentinel to trigger infinite scrolling
  React.useEffect(() => {
    if (!hasMore || isLoadingMore || isRefetching) return

    const target = sentinelRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextRef.current) {
          void handleLoadMore()
        }
      },
      { rootMargin: "250px" },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, isRefetching, handleLoadMore])

  const sortLabels: Record<SortOption, string> = {
    newest: dict?.feed?.sortNewest ?? "Newest",
    lowest_price: dict?.feed?.sortLowestPrice ?? "Price: Low to High",
    highest_price: dict?.feed?.sortHighestPrice ?? "Price: High to Low",
    available_soonest: dict?.feed?.sortAvailableSoonest ?? "Available Soonest",
    nearest: "Nearest",
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 pt-6 pb-20 md:px-6 md:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </span>
            <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {dict?.feed?.title ?? "Accommodations Near You"}
            </h1>
          </div>
          <p className="mt-1 text-xs md:text-sm text-muted-foreground">
            {dict?.feed?.subtitle ??
              "Explore verified rooms, seats, and flats in Dhaka"}
          </p>
        </div>

        <Link
          href={`/${lang}/search`}
          className="flex items-center gap-2.5 rounded-xl border border-input bg-card px-3.5 py-2 text-xs md:text-sm text-muted-foreground shadow-xs hover:border-primary/50 hover:text-foreground transition-all sm:w-64"
        >
          <Search className="size-4 text-muted-foreground shrink-0" />
          <span className="truncate">
            {dict?.feed?.searchPrompt ?? "Search by area or college..."}
          </span>
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={toggleNearMe}
            disabled={isLocating}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all shrink-0 min-h-9 border",
              userLocation
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-muted text-muted-foreground border-transparent hover:bg-accent hover:text-foreground",
            )}
          >
            {isLocating ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Compass className="size-3.5" />
            )}
            <span>{dict?.feed?.nearMe ?? "Near Me"}</span>
            {userLocation && (
              <span className="text-[10px] bg-primary-foreground/20 px-1.5 py-0.5 rounded-full font-semibold">
                3 km
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onTypeSelect("ALL")}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all shrink-0 min-h-9",
              typeFilter === "ALL"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {dict?.feed?.all ?? "All"}
          </button>
          <button
            type="button"
            onClick={() => onTypeSelect("ROOM")}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all shrink-0 min-h-9",
              typeFilter === "ROOM"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {dict?.feed?.rooms ?? "Rooms"}
          </button>
          <button
            type="button"
            onClick={() => onTypeSelect("SEAT")}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all shrink-0 min-h-9",
              typeFilter === "SEAT"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {dict?.feed?.seats ?? "Seats"}
          </button>
          <button
            type="button"
            onClick={() => onTypeSelect("FLAT")}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all shrink-0 min-h-9",
              typeFilter === "FLAT"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {dict?.feed?.flats ?? "Flats"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative" ref={sortRef}>
            <button
              type="button"
              onClick={() => setIsSortOpen((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors min-h-9"
            >
              <SlidersHorizontal className="size-3.5 text-muted-foreground" />
              <span>{sortLabels[sortOption]}</span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </button>

            {isSortOpen && (
              <div className="absolute right-0 top-10 z-30 w-48 rounded-lg border border-border bg-popover p-1 shadow-lg text-xs">
                {(
                  [
                    "newest",
                    "lowest_price",
                    "highest_price",
                    "available_soonest",
                  ] as SortOption[]
                ).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => onSortSelect(opt)}
                    className={cn(
                      "flex w-full items-center px-3 py-2 rounded-md text-left transition-colors",
                      sortOption === opt
                        ? "bg-accent font-semibold text-primary"
                        : "text-foreground hover:bg-accent/50",
                    )}
                  >
                    {sortLabels[opt]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center rounded-lg border border-border bg-card p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title={dict?.feed?.viewGrid ?? "Grid View"}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "grid"
                  ? "bg-muted text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("feed")}
              title={dict?.feed?.viewFeed ?? "Feed View"}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "feed"
                  ? "bg-muted text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <SquareDashedKanban className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {dict?.feed?.countFound
            ? dict.feed.countFound.replace("{count}", String(total))
            : `${total} listings found`}
        </span>
      </div>

      {isRefetching ? (
        <FeedSkeleton count={6} viewMode={viewMode} />
      ) : listings.length === 0 ? (
        <FeedEmptyState
          lang={lang}
          dict={dict}
          onReset={() => {
            setTypeFilter("ALL")
            void handleFilterOrSortChange("ALL", sortOption)
          }}
        />
      ) : (
        <div
          className={cn(
            viewMode === "feed"
              ? "flex flex-col max-w-2xl mx-auto space-y-6 w-full"
              : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full",
          )}
        >
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              lang={lang}
              dict={dict}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}

      {listings.length > 0 && (
        <div className="flex flex-col items-center justify-center pt-6">
          {hasMore && (
            <div
              ref={sentinelRef}
              className="h-4 w-full flex items-center justify-center pointer-events-none"
              aria-hidden="true"
            />
          )}

          {isLoadingMore && (
            <div
              className="flex items-center justify-center py-4"
              aria-live="polite"
            >
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!hasMore && (
            <div className="py-4 text-center">
              <p className="text-xs md:text-sm text-muted-foreground">
                {dict?.feed?.endOfResults ??
                  "You've reached the end — showing all available listings within your active radius"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

