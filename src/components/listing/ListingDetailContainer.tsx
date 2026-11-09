"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { ListingGallery } from "@/components/listing/ListingGallery"
import { ListingDetailsSection } from "@/components/listing/ListingDetailsSection"
import { OwnerCard } from "@/components/listing/OwnerCard"
import { OwnerControls } from "@/components/listing/OwnerControls"
import { ReportModal } from "@/components/listing/ReportModal"
import { CommentsSection } from "@/components/listing/CommentsSection"
import { ActionGate } from "@/components/auth/ActionGate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Bookmark,
  Share2,
  Flag,
  Check,
  MapPin,
  Calendar,
  Clock,
  Phone,
  MessageCircle,
  Shield,
  Loader2,
} from "lucide-react"
import type { AvailabilityStatus, ListingDetail } from "@/types"
import type { Dictionary } from "@/app/[lang]/dictionaries"

// Dynamically imports Leaflet map to prevent SSR window reference crashes
const ListingLocationMap = dynamic(
  () => import("@/components/listing/ListingLocationMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 sm:h-72 w-full rounded-2xl bg-muted/40 animate-pulse border border-border flex items-center justify-center text-muted-foreground text-xs">
        Loading map...
      </div>
    ),
  },
)

type ListingDetailContainerProps = {
  listing: ListingDetail
  currentUserId?: string
  currentUserRole?: string
  lang: string
  dict: Dictionary
}

function formatRelativeTime(dateString: string, lang: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return lang === "bn" ? "এইমাত্র" : "Just now"
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

export function ListingDetailContainer({
  listing,
  currentUserId,
  currentUserRole,
  lang,
  dict,
}: ListingDetailContainerProps) {
  const router = useRouter()
  const [isSaved, setIsSaved] = React.useState<boolean>(Boolean(listing.isSaved))
  const [savedCount, setSavedCount] = React.useState<number>(listing.savedCount || 0)
  const [isSaving, setIsSaving] = React.useState(false)
  const [reportOpen, setReportOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [status, setStatus] = React.useState<AvailabilityStatus>(listing.availabilityStatus)
  const [isStartingChat, setIsStartingChat] = React.useState(false)

  const isOwner = currentUserId === listing.owner.id

  const handleStartChat = async () => {
    if (!currentUserId) {
      router.push(`/${lang}/login?from=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    setIsStartingChat(true)
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: listing.owner.id,
          listingId: listing.id,
        }),
      })
      const data = await res.json()
      if (data.success && data.data?.conversationId) {
        router.push(`/${lang}/messages/${data.data.conversationId}`)
      }
    } catch (err) {
      console.error("Failed to start chat:", err)
    } finally {
      setIsStartingChat(false)
    }
  }

  const handleSaveToggle = async () => {
    const nextSaved = !isSaved
    setIsSaved(nextSaved)
    setSavedCount((prev) => (nextSaved ? prev + 1 : Math.max(0, prev - 1)))
    setIsSaving(true)

    try {
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      })
      const data = await res.json()
      if (!data.success) {
        setIsSaved(!nextSaved)
        setSavedCount((prev) => (nextSaved ? Math.max(0, prev - 1) : prev + 1))
      }
    } catch {
      setIsSaved(!nextSaved)
      setSavedCount((prev) => (nextSaved ? Math.max(0, prev - 1) : prev + 1))
    } finally {
      setIsSaving(false)
    }
  }

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formattedRent = listing.monthlyRent.toLocaleString(
    lang === "bn" ? "bn-BD" : "en-US",
  )

  const formattedDate = new Date(listing.availableFrom).toLocaleDateString(
    lang === "bn" ? "bn-BD" : "en-US",
    { month: "short", day: "numeric", year: "numeric" },
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-12 space-y-6">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/${lang}/search`}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
          <span>{dict.listing.backToSearch}</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Share Action Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="gap-1.5 text-xs font-semibold rounded-lg border-border"
          >
            {copied ? <Check className="size-3.5 text-primary" /> : <Share2 className="size-3.5" />}
            <span className="hidden sm:inline">{copied ? dict.listing.copied : dict.listing.share}</span>
          </Button>

          {/* Action-gated Save Bookmark */}
          <ActionGate onUnauthenticated={() => {}}>
            <Button
              variant={isSaved ? "default" : "outline"}
              size="sm"
              disabled={isSaving}
              onClick={handleSaveToggle}
              className={`gap-1.5 text-xs font-semibold rounded-lg transition-all ${
                isSaved ? "bg-primary text-primary-foreground" : "border-border"
              }`}
            >
              <Bookmark className={`size-3.5 ${isSaved ? "fill-current" : ""}`} />
              <span className="hidden sm:inline">{isSaved ? dict.listing.saved : dict.listing.save}</span>
              {savedCount > 0 && <span className="text-xs opacity-90">({savedCount})</span>}
            </Button>
          </ActionGate>

          {/* Action-gated Report Button */}
          <ActionGate onUnauthenticated={() => {}}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReportOpen(true)}
              className="gap-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
              title={dict.listing.reportListing}
            >
              <Flag className="size-3.5" />
              <span className="hidden sm:inline">{dict.listing.report}</span>
            </Button>
          </ActionGate>
        </div>
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Media, Header, Details, Map, Comments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header: Title, Area, Status Badges */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={status === "AVAILABLE" ? "default" : "secondary"}
                className="font-semibold text-xs"
              >
                {dict.listing[status.toLowerCase() as "available" | "rented" | "hidden" | "unavailable"] || status}
              </Badge>
              <Badge variant="outline" className="text-xs font-medium border-border">
                {dict.listing.types[listing.accommodationType] || listing.accommodationType}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                <Clock className="size-3" />
                {formatRelativeTime(listing.createdAt, lang)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-snug">
              {listing.title}
            </h1>

            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4 text-primary shrink-0" />
              <span>{listing.address}, {listing.area}</span>
            </div>
          </div>

          {/* Photo Gallery Carousel */}
          <ListingGallery
            photos={listing.photos}
            title={listing.title}
            dict={dict}
          />

          {/* Core Accommodation Details & Facilities */}
          <ListingDetailsSection
            listing={listing}
            lang={lang}
            dict={dict}
          />

          {/* Neighborhood Map */}
          <ListingLocationMap
            latitude={listing.latitude}
            longitude={listing.longitude}
            area={listing.area}
            address={listing.address}
            dict={dict}
            locationPrecision={listing.locationPrecision}
          />

          {/* Interactive Comments & Discussions Thread */}
          <CommentsSection
            listingId={listing.id}
            listingOwnerId={listing.ownerId}
            initialComments={listing.comments}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            lang={lang}
            dict={dict}
          />
        </div>

        {/* Right 1 Column: Sticky Desktop Pricing Card & Owner Info */}
        <div className="lg:col-span-1 space-y-5">
          <div className="lg:sticky lg:top-20 space-y-5">
            {/* Rent Pricing Card */}
            <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-5">
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-foreground">
                    ৳{formattedRent}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {dict.listing.perMonth}
                  </span>
                </div>
                <div className="pt-1">
                  <Badge
                    variant={listing.billsIncluded ? "secondary" : "outline"}
                    className="text-xs font-semibold"
                  >
                    {listing.billsIncluded ? dict.listing.billsIncluded : dict.listing.billsExcluded}
                  </Badge>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-primary" />
                    {dict.listing.availableFrom}:
                  </span>
                  <span className="font-semibold text-foreground">{formattedDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Shield className="size-3.5 text-primary" />
                    Status:
                  </span>
                  <span className="font-semibold text-foreground">
                    {dict.listing[status.toLowerCase() as "available" | "rented" | "hidden" | "unavailable"] || status}
                  </span>
                </div>
              </div>

              {/* Action-gated Bookmark Button */}
              <ActionGate onUnauthenticated={() => {}}>
                <Button
                  size="lg"
                  disabled={isSaving}
                  onClick={handleSaveToggle}
                  className={`w-full font-bold rounded-xl gap-2 transition-all ${
                    isSaved
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                >
                  <Bookmark className={`size-4 ${isSaved ? "fill-current" : ""}`} />
                  {isSaved ? dict.listing.saved : dict.listing.save}
                </Button>
              </ActionGate>
            </div>

            {/* Owner Identity Card */}
            <OwnerCard
              owner={listing.owner}
              listingId={listing.id}
              currentUserId={currentUserId}
              lang={lang}
              dict={dict}
            />

            {/* Owner Control Actions (Mark Rented, Hide, Delete) */}
            <OwnerControls
              listing={listing}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              lang={lang}
              dict={dict}
              onStatusChange={(newStatus) => setStatus(newStatus)}
            />
          </div>
        </div>
      </div>

      {/* Mobile Fixed Sticky Bottom Action Bar (< 768px) */}
      <div className="fixed bottom-16 left-0 right-0 z-20 md:hidden bg-background/95 backdrop-blur-md border-t border-border px-4 py-2.5 flex items-center justify-between shadow-lg">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-foreground">৳{formattedRent}</span>
            <span className="text-xs text-muted-foreground">{dict.listing.perMonth}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {listing.billsIncluded ? dict.listing.billsIncluded : dict.listing.billsExcluded}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ActionGate onUnauthenticated={() => {}}>
            <Button
              variant={isSaved ? "default" : "outline"}
              size="sm"
              disabled={isSaving}
              onClick={handleSaveToggle}
              className="h-10 px-3 rounded-xl border-border"
              aria-label="Save listing"
            >
              <Bookmark className={`size-4 ${isSaved ? "fill-current" : ""}`} />
            </Button>
          </ActionGate>

          {!isOwner && (
            <>
              <Button
                size="sm"
                onClick={handleStartChat}
                disabled={isStartingChat}
                className="h-10 px-3.5 rounded-xl font-bold bg-primary text-primary-foreground gap-1.5 shadow-xs"
              >
                {isStartingChat ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <MessageCircle className="size-4" />
                )}
                <span>{dict.listing.messageHost ?? "Message"}</span>
              </Button>

              {listing.owner.showContactInfo !== false && (
                <ActionGate onUnauthenticated={() => {}}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const phone = listing.owner.phone || "01712345678"
                      window.location.href = `tel:${phone}`
                    }}
                    className="h-10 px-3 rounded-xl font-semibold border-border gap-1.5"
                    aria-label={dict.listing.contactOwner}
                  >
                    <Phone className="size-4" />
                  </Button>
                </ActionGate>
              )}
            </>
          )}
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        listingId={listing.id}
        open={reportOpen}
        onOpenChange={setReportOpen}
        dict={dict}
      />
    </div>
  )
}
