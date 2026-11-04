"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Calendar,
  Home,
  Users,
  Building,
  Layers,
  Bath,
  Sun,
  Wifi,
  Utensils,
  Zap,
  ArrowUpDown,
  ShieldCheck,
  Snowflake,
  Sparkles,
  CheckCircle2,
  FileText,
} from "lucide-react"
import type { ListingDetail } from "@/types"
import type { Dictionary } from "@/app/[lang]/dictionaries"

type ListingDetailsSectionProps = {
  listing: ListingDetail
  lang: string
  dict: Dictionary
}

function getFacilityIcon(facility: string) {
  const norm = facility.toLowerCase()
  if (norm.includes("wifi") || norm.includes("internet")) return Wifi
  if (norm.includes("bath") || norm.includes("washroom")) return Bath
  if (norm.includes("kitchen") || norm.includes("gas") || norm.includes("dining")) return Utensils
  if (norm.includes("lift") || norm.includes("elevator")) return ArrowUpDown
  if (norm.includes("generator") || norm.includes("ips") || norm.includes("electricity")) return Zap
  if (norm.includes("balcony") || norm.includes("terrace")) return Sun
  if (norm.includes("cctv") || norm.includes("guard") || norm.includes("security")) return ShieldCheck
  if (norm.includes("fridge") || norm.includes("refrigerator")) return Snowflake
  if (norm.includes("maid") || norm.includes("cleaning")) return Sparkles
  return CheckCircle2
}

export function ListingDetailsSection({
  listing,
  lang,
  dict,
}: ListingDetailsSectionProps) {
  const formattedAvailableDate = React.useMemo(() => {
    const d = new Date(listing.availableFrom)
    return d.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }, [listing.availableFrom, lang])

  const hasFlatInfo = Boolean(
    listing.totalRooms ||
      listing.totalWashrooms ||
      listing.balconies !== null ||
      listing.floorLevel !== null,
  )

  return (
    <div className="space-y-6">
      {/* Overview Highlights Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="px-3 py-1 text-sm font-medium border-primary/20 bg-primary/5 text-primary">
          <Home className="size-3.5 mr-1.5" />
          {dict.listing.types[listing.accommodationType] || listing.accommodationType}
        </Badge>
        <Badge variant="outline" className="px-3 py-1 text-sm font-medium border-border">
          <Users className="size-3.5 mr-1.5" />
          {dict.listing.genders[listing.genderPreference] || listing.genderPreference}
        </Badge>
        <Badge variant="outline" className="px-3 py-1 text-sm font-medium border-border">
          {dict.listing.tenants[listing.tenantType] || listing.tenantType}
        </Badge>
        <Badge variant="outline" className="px-3 py-1 text-sm font-medium border-border">
          <Calendar className="size-3.5 mr-1.5" />
          {dict.listing.availableFrom} {formattedAvailableDate}
        </Badge>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          {dict.listing.description}
        </h2>
        <div className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line bg-card/60 p-4 rounded-xl border border-border">
          {listing.description}
        </div>
      </div>

      {/* Facilities Grid */}
      {listing.facilities && listing.facilities.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {dict.listing.facilities}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {listing.facilities.map((facility, idx) => {
              const Icon = getFacilityIcon(facility)
              return (
                <div
                  key={`${facility}-${idx}`}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-card/60 text-card-foreground text-sm font-medium shadow-2xs hover:bg-muted/40 transition-colors"
                >
                  <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="size-4" />
                  </div>
                  <span className="truncate capitalize">{facility}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Flat Information Accordion */}
      {hasFlatInfo && (
        <div className="space-y-2">
          <Accordion defaultValue={["flat-info"]} className="w-full border border-border rounded-xl px-4 bg-card/60">
            <AccordionItem value="flat-info" className="border-none">
              <AccordionTrigger className="text-base font-semibold hover:no-underline py-4">
                <div className="flex items-center gap-2 text-foreground">
                  <Building className="size-4 text-primary" />
                  {dict.listing.flatInfo}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {listing.totalRooms !== null && listing.totalRooms !== undefined && (
                    <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                      <p className="text-xs text-muted-foreground">{dict.listing.rooms}</p>
                      <p className="text-base font-semibold text-foreground mt-0.5">{listing.totalRooms}</p>
                    </div>
                  )}
                  {listing.totalWashrooms !== null && listing.totalWashrooms !== undefined && (
                    <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                      <p className="text-xs text-muted-foreground">{dict.listing.washrooms}</p>
                      <p className="text-base font-semibold text-foreground mt-0.5">{listing.totalWashrooms}</p>
                    </div>
                  )}
                  {listing.balconies !== null && listing.balconies !== undefined && (
                    <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                      <p className="text-xs text-muted-foreground">{dict.listing.balconies}</p>
                      <p className="text-base font-semibold text-foreground mt-0.5">{listing.balconies}</p>
                    </div>
                  )}
                  {listing.floorLevel !== null && listing.floorLevel !== undefined && (
                    <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                      <p className="text-xs text-muted-foreground">{dict.listing.floor}</p>
                      <p className="text-base font-semibold text-foreground mt-0.5">
                        {lang === "bn" ? `${listing.floorLevel} তলা` : `${listing.floorLevel}th floor`}
                      </p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </div>
  )
}
