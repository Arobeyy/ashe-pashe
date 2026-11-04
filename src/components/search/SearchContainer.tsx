"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { useSearchParams, useRouter } from "next/navigation"
import {
  Search,
  SlidersHorizontal,
  Map as MapIcon,
  List as ListIcon,
  ChevronDown,
  Loader2,
  X,
  MapPin,
  Sparkles,
  ArrowUpDown,
  Compass,
} from "lucide-react"
import { ListingCard } from "@/components/feed/ListingCard"
import { FeedSkeleton } from "@/components/feed/FeedSkeleton"
import { FeedEmptyState } from "@/components/feed/FeedEmptyState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  FilterControls,
  type SearchFilterState,
} from "@/components/search/FilterControls"
import { cn } from "@/lib/utils"
import type {
  AccommodationType,
  ApiResponse,
  GenderPreference,
  ListingCard as ListingCardType,
  SortOption,
  TenantType,
} from "@/types"
import type { Dictionary } from "@/app/[lang]/dictionaries"

// Dynamically import Leaflet map without SSR to avoid window undefined errors
const SearchMap = dynamic(() => import("./SearchMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full min-h-[350px] items-center justify-center bg-muted/40 rounded-xl">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-primary" />
        <span>Loading map...</span>
      </div>
    </div>
  ),
})

type SearchContainerProps = {
  initialListings: ListingCardType[]
  initialTotal: number
  initialHasMore: boolean
  initialFilters: SearchFilterState
  initialSort: SortOption
  lang: string
  dict: Dictionary
}

export function SearchContainer({
  initialListings,
  initialTotal,
  initialHasMore,
  initialFilters,
  initialSort,
  lang,
  dict,
}: SearchContainerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [listings, setListings] = React.useState<ListingCardType[]>(initialListings)
  const [total, setTotal] = React.useState(initialTotal)
  const [hasMore, setHasMore] = React.useState(initialHasMore)
  const [page, setPage] = React.useState(1)
  const [filters, setFilters] = React.useState<SearchFilterState>(initialFilters)
  const [sort, setSort] = React.useState<SortOption>(initialSort)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = React.useState(false)
  const [mobileView, setMobileView] = React.useState<"list" | "map">("list")
  const [showDesktopMap, setShowDesktopMap] = React.useState(true)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const [isLocating, setIsLocating] = React.useState(false)
  const [hoveredListingId, setHoveredListingId] = React.useState<string | null>(null)
  const [isSortOpen, setIsSortOpen] = React.useState(false)
  const sortRef = React.useRef<HTMLDivElement>(null)

  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null)
  const isFirstRender = React.useRef(true)

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

  // Synchronizes filter state to URL query parameters for shareable links
  const syncUrlParams = React.useCallback(
    (currentFilters: SearchFilterState, currentSort: SortOption, currentPage: number) => {
      const params = new URLSearchParams()
      if (currentFilters.q) params.set("q", currentFilters.q)
      if (currentFilters.area) params.set("area", currentFilters.area)
      if (currentFilters.minRent) params.set("minRent", currentFilters.minRent)
      if (currentFilters.maxRent) params.set("maxRent", currentFilters.maxRent)
      if (currentFilters.type) params.set("type", currentFilters.type)
      if (currentFilters.genderPreference) params.set("genderPreference", currentFilters.genderPreference)
      if (currentFilters.tenantType) params.set("tenantType", currentFilters.tenantType)
      if (currentFilters.lat !== undefined && currentFilters.lng !== undefined) {
        params.set("lat", currentFilters.lat.toFixed(6))
        params.set("lng", currentFilters.lng.toFixed(6))
        params.set("radius", currentFilters.radius.toString())
      }
      if (currentSort !== "newest") params.set("sort", currentSort)
      if (currentPage > 1) params.set("page", currentPage.toString())

      const query = params.toString()
      const newUrl = query ? `/${lang}/search?${query}` : `/${lang}/search`
      window.history.replaceState(null, "", newUrl)
    },
    [lang],
  )

  // Executes query to API and refreshes listing cards
  const fetchListings = React.useCallback(
    async (
      currentFilters: SearchFilterState,
      currentSort: SortOption,
      targetPage: number = 1,
      append: boolean = false,
    ) => {
      if (append) {
        setIsLoadingMore(true)
      } else {
        setIsLoading(true)
      }

      try {
        const params = new URLSearchParams()
        if (currentFilters.q) params.set("q", currentFilters.q)
        if (currentFilters.area) params.set("area", currentFilters.area)
        if (currentFilters.minRent) params.set("minRent", currentFilters.minRent)
        if (currentFilters.maxRent) params.set("maxRent", currentFilters.maxRent)
        if (currentFilters.type) params.set("type", currentFilters.type)
        if (currentFilters.genderPreference) params.set("genderPreference", currentFilters.genderPreference)
        if (currentFilters.tenantType) params.set("tenantType", currentFilters.tenantType)
        if (currentFilters.lat !== undefined && currentFilters.lng !== undefined) {
          params.set("lat", currentFilters.lat.toString())
          params.set("lng", currentFilters.lng.toString())
          params.set("radius", currentFilters.radius.toString())
        }
        params.set("sort", currentSort)
        params.set("page", targetPage.toString())
        params.set("limit", "12")

        const res = await fetch(`/api/listings?${params.toString()}`)
        const json = (await res.json()) as ApiResponse<ListingCardType[]>

        if (json.success && json.data) {
          if (append) {
            setListings((prev) => [...prev, ...(json.data || [])])
          } else {
            setListings(json.data)
          }
          setTotal(json.pagination?.total ?? json.data.length)
          setHasMore(Boolean(json.pagination?.hasMore))
          setPage(targetPage)
        }
      } catch (err) {
        console.error("Failed to query listings", err)
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [],
  )

  // Debounces text inputs and immediately fetches on discrete filter changes
  const applyFilters = React.useCallback(
    (newFilters: SearchFilterState, newSort: SortOption, immediate: boolean = false) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      syncUrlParams(newFilters, newSort, 1)

      if (immediate) {
        void fetchListings(newFilters, newSort, 1, false)
      } else {
        debounceTimerRef.current = setTimeout(() => {
          void fetchListings(newFilters, newSort, 1, false)
        }, 350)
      }
    },
    [fetchListings, syncUrlParams],
  )

  const handleFilterChange = (newFilters: SearchFilterState) => {
    const isTextOnlyChange =
      newFilters.q !== filters.q ||
      newFilters.area !== filters.area ||
      newFilters.minRent !== filters.minRent ||
      newFilters.maxRent !== filters.maxRent

    setFilters(newFilters)
    applyFilters(newFilters, sort, !isTextOnlyChange)
  }

  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort)
    setIsSortOpen(false)
    applyFilters(filters, newSort, true)
  }

  const handleResetFilters = () => {
    const resetState: SearchFilterState = {
      q: "",
      area: "",
      minRent: "",
      maxRent: "",
      radius: 3,
      lat: undefined,
      lng: undefined,
      type: undefined,
      genderPreference: undefined,
      tenantType: undefined,
    }
    setFilters(resetState)
    setSort("newest")
    applyFilters(resetState, "newest", true)
  }

  const handleMapCenterChange = (lat: number, lng: number) => {
    const updated = {
      ...filters,
      lat,
      lng,
    }
    setFilters(updated)
    applyFilters(updated, sort, true)
  }

  // Activates geolocation on demand and centers within 3 km radius
  const handleNearMe = () => {
    if (filters.lat !== undefined && filters.lng !== undefined) {
      handleFilterChange({
        ...filters,
        lat: undefined,
        lng: undefined,
      })
      return
    }
    if (!navigator.geolocation) return
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false)
        handleFilterChange({
          ...filters,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          radius: 3,
        })
      },
      () => {
        setIsLocating(false)
      },
      { timeout: 10000, enableHighAccuracy: true },
    )
  }

  const handleLoadMore = () => {
    if (isLoadingMore || !hasMore) return
    const nextPage = page + 1
    syncUrlParams(filters, sort, nextPage)
    void fetchListings(filters, sort, nextPage, true)
  }

  const activeFilterCount = [
    Boolean(filters.q),
    Boolean(filters.area),
    Boolean(filters.minRent || filters.maxRent),
    Boolean(filters.type),
    Boolean(filters.genderPreference),
    Boolean(filters.tenantType),
    filters.lat !== undefined,
  ].filter(Boolean).length

  const sortLabels: Record<SortOption, string> = {
    newest: dict?.search?.sortNewest ?? "Newest",
    nearest: dict?.search?.sortNearest ?? "Nearest",
    lowest_price: dict?.search?.sortLowestPrice ?? "Price: Low to High",
    highest_price: dict?.search?.sortHighestPrice ?? "Price: High to Low",
    available_soonest: dict?.search?.sortAvailableSoonest ?? "Available Soonest",
  }

  const mapCenter: [number, number] | null =
    filters.lat !== undefined && filters.lng !== undefined
      ? [filters.lat, filters.lng]
      : null

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-4 md:px-6 md:py-6 flex flex-col gap-5">
      {/* Search Header Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight text-foreground">
              {dict?.search?.title ?? "Search Accommodations"}
            </h1>
            <span className="text-xs text-muted-foreground font-medium">
              ({total})
            </span>
          </div>

          {/* Desktop Map Toggle */}
          <div className="hidden lg:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDesktopMap((prev) => !prev)}
              className="text-xs gap-1.5 h-8"
            >
              <MapIcon className="size-3.5" />
              <span>{showDesktopMap ? "Hide Map" : "Show Map"}</span>
            </Button>
          </div>
        </div>

        {/* Search Input Bar + Filter Trigger */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={dict?.search?.placeholder ?? "Search area, road, or college..."}
              value={filters.q}
              onChange={(e) => handleFilterChange({ ...filters, q: e.target.value })}
              className="pl-9 pr-9 h-11 bg-card text-sm"
            />
            {filters.q && (
              <button
                type="button"
                onClick={() => handleFilterChange({ ...filters, q: "" })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Near Me Trigger Button */}
          <Button
            type="button"
            variant={filters.lat !== undefined && filters.lng !== undefined ? "default" : "outline"}
            onClick={handleNearMe}
            disabled={isLocating}
            className="h-11 px-3.5 gap-1.5 shrink-0"
            title={dict?.feed?.nearMe ?? "Near Me (3 km)"}
          >
            {isLocating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Compass className="size-4" />
            )}
            <span className="hidden sm:inline text-xs font-semibold">
              {dict?.feed?.nearMe ?? "Near Me"}
            </span>
          </Button>

          {/* Mobile Filter Button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsFilterSheetOpen(true)}
            className="md:hidden h-11 px-3.5 gap-1.5 relative shrink-0"
          >
            <SlidersHorizontal className="size-4 text-primary" />
            <span className="text-xs font-semibold">{dict?.search?.filters ?? "Filters"}</span>
            {activeFilterCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* Desktop Sort Dropdown */}
          <div className="relative hidden md:block" ref={sortRef}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSortOpen((prev) => !prev)}
              className="h-11 px-3 gap-1.5 text-xs font-medium"
            >
              <ArrowUpDown className="size-3.5 text-muted-foreground" />
              <span>{sortLabels[sort]}</span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </Button>

            {isSortOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-40 w-48 rounded-lg border border-border bg-popover p-1 shadow-md">
                {(Object.keys(sortLabels) as SortOption[]).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSortChange(opt)}
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-2 text-xs rounded-md transition-colors",
                      sort === opt
                        ? "bg-accent text-accent-foreground font-semibold"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    <span>{sortLabels[opt]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Filter Tags */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {filters.type && (
              <Badge variant="secondary" className="gap-1 pr-1.5 text-xs">
                <span>{filters.type}</span>
                <X
                  className="size-3 cursor-pointer hover:text-destructive"
                  onClick={() => handleFilterChange({ ...filters, type: undefined })}
                />
              </Badge>
            )}
            {filters.genderPreference && (
              <Badge variant="secondary" className="gap-1 pr-1.5 text-xs">
                <span>{filters.genderPreference}</span>
                <X
                  className="size-3 cursor-pointer hover:text-destructive"
                  onClick={() => handleFilterChange({ ...filters, genderPreference: undefined })}
                />
              </Badge>
            )}
            {filters.tenantType && (
              <Badge variant="secondary" className="gap-1 pr-1.5 text-xs">
                <span>{filters.tenantType}</span>
                <X
                  className="size-3 cursor-pointer hover:text-destructive"
                  onClick={() => handleFilterChange({ ...filters, tenantType: undefined })}
                />
              </Badge>
            )}
            {(filters.minRent || filters.maxRent) && (
              <Badge variant="secondary" className="gap-1 pr-1.5 text-xs">
                <span>
                  ৳{filters.minRent || "0"} - ৳{filters.maxRent || "∞"}
                </span>
                <X
                  className="size-3 cursor-pointer hover:text-destructive"
                  onClick={() => handleFilterChange({ ...filters, minRent: "", maxRent: "" })}
                />
              </Badge>
            )}
            {filters.lat !== undefined && filters.lng !== undefined && (
              <Badge variant="secondary" className="gap-1 pr-1.5 text-xs">
                <MapPin className="size-3 text-primary" />
                <span>{filters.radius} km</span>
                <X
                  className="size-3 cursor-pointer hover:text-destructive"
                  onClick={() =>
                    handleFilterChange({
                      ...filters,
                      lat: undefined,
                      lng: undefined,
                    })
                  }
                />
              </Badge>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 ml-1"
            >
              {dict?.search?.reset ?? "Clear all"}
            </button>
          </div>
        )}
      </div>

      {/* Main Layout Area */}
      <div className="flex items-start gap-6 relative">
        {/* Desktop Sticky Filter Sidebar */}
        <aside className="hidden md:block w-72 shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
          <FilterControls
            filters={filters}
            onChange={handleFilterChange}
            onReset={handleResetFilters}
            dict={dict}
            className="pb-6"
          />
        </aside>

        {/* Listings Cards Column */}
        <div
          className={cn(
            "flex-1 min-w-0 flex flex-col gap-4",
            mobileView === "map" ? "hidden md:flex" : "flex",
          )}
        >
          {/* Mobile sort row */}
          <div className="flex md:hidden items-center justify-between pb-2 border-b border-border">
            <span className="text-xs text-muted-foreground">
              {total} {dict?.search?.results?.replace("{count}", total.toString()) ?? "places found"}
            </span>

            <div className="relative" ref={sortRef}>
              <button
                type="button"
                onClick={() => setIsSortOpen((prev) => !prev)}
                className="flex items-center gap-1.5 text-xs font-medium text-foreground py-1 px-2 rounded-md hover:bg-muted"
              >
                <span>{sortLabels[sort]}</span>
                <ChevronDown className="size-3" />
              </button>

              {isSortOpen && (
                <div className="absolute right-0 top-full mt-1 z-40 w-44 rounded-lg border border-border bg-popover p-1 shadow-md">
                  {(Object.keys(sortLabels) as SortOption[]).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSortChange(opt)}
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-1.5 text-xs rounded-md",
                        sort === opt
                          ? "bg-accent text-accent-foreground font-semibold"
                          : "text-foreground hover:bg-muted",
                      )}
                    >
                      <span>{sortLabels[opt]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Results Grid */}
          {isLoading ? (
            <FeedSkeleton />
          ) : listings.length === 0 ? (
            <FeedEmptyState lang={lang} dict={dict} onReset={handleResetFilters} />
          ) : (
            <div
              className={cn(
                "grid grid-cols-1 gap-4",
                showDesktopMap ? "lg:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3",
              )}
            >
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  onMouseEnter={() => setHoveredListingId(listing.id)}
                  onMouseLeave={() => setHoveredListingId(null)}
                >
                  <ListingCard
                    listing={listing}
                    lang={lang}
                    dict={dict}
                    viewMode="grid"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && !isLoading && (
            <div className="flex justify-center pt-4 pb-8">
              <Button
                variant="outline"
                size="lg"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="min-w-[160px] gap-2 min-h-[44px]"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>{dict?.feed?.loading ?? "Loading..."}</span>
                  </>
                ) : (
                  <span>{dict?.feed?.loadMore ?? "Load More"}</span>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Desktop Sticky Map Panel */}
        {showDesktopMap && (
          <div className="hidden lg:block w-[420px] xl:w-[480px] shrink-0 sticky top-20 self-start h-[calc(100vh-6rem)] rounded-xl border border-border overflow-hidden shadow-sm">
            <SearchMap
              center={mapCenter}
              radiusKm={filters.radius}
              listings={listings}
              onCenterChange={handleMapCenterChange}
              lang={lang}
              dict={dict}
              hoveredListingId={hoveredListingId}
            />
          </div>
        )}
      </div>

      {/* Mobile Fullscreen Map View */}
      <div
        className={cn(
          "w-full h-[calc(100vh-12rem)] rounded-xl border border-border overflow-hidden md:hidden",
          mobileView === "map" ? "block" : "hidden",
        )}
      >
        <SearchMap
          center={mapCenter}
          radiusKm={filters.radius}
          listings={listings}
          onCenterChange={handleMapCenterChange}
          lang={lang}
          dict={dict}
          hoveredListingId={hoveredListingId}
        />
      </div>

      {/* Mobile Floating Map/List Switcher Pill */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 md:hidden">
        <button
          type="button"
          onClick={() => setMobileView((prev) => (prev === "list" ? "map" : "list"))}
          className="flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-3 text-xs font-semibold shadow-lg hover:bg-primary/90 transition-transform active:scale-95 border border-primary-foreground/20"
        >
          {mobileView === "list" ? (
            <>
              <MapIcon className="size-4" />
              <span>{dict?.search?.mapView ?? "Map"} ({total})</span>
            </>
          ) : (
            <>
              <ListIcon className="size-4" />
              <span>{dict?.search?.listView ?? "List"} ({total})</span>
            </>
          )}
        </button>
      </div>

      {/* Mobile Filter Sheet */}
      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl p-5">
          <SheetHeader className="p-0 pb-3 border-b border-border">
            <SheetTitle className="text-base font-bold">
              {dict?.search?.filters ?? "Filters"}
            </SheetTitle>
          </SheetHeader>
          <div className="pt-3">
            <FilterControls
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleResetFilters}
              dict={dict}
              isMobileSheet={true}
              onCloseSheet={() => setIsFilterSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

