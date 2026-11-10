"use client"

import * as React from "react"
import L from "leaflet"
import { MapPin, ExternalLink, ShieldCheck, Compass, CircleDot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Dictionary } from "@/app/[lang]/dictionaries"

type ListingLocationMapProps = {
  latitude: number
  longitude: number
  area: string
  address: string
  dict: Dictionary
  locationPrecision?: "APPROXIMATE" | "EXACT"
}

const createListingPinIcon = () =>
  L.divIcon({
    className: "custom-listing-location-pin",
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background-color: var(--primary); opacity: 0.25; animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; width: 24px; height: 24px; border-radius: 9999px; background-color: var(--primary); border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <div style="width: 6px; height: 6px; border-radius: 9999px; background-color: white;"></div>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })

export default function ListingLocationMap({
  latitude,
  longitude,
  area,
  address,
  dict,
  locationPrecision = "APPROXIMATE",
}: ListingLocationMapProps) {
  const [activeMode, setActiveMode] = React.useState<"APPROXIMATE" | "EXACT">(
    locationPrecision === "EXACT" ? "EXACT" : "APPROXIMATE",
  )
  const mapContainerRef = React.useRef<HTMLDivElement>(null)
  const mapInstanceRef = React.useRef<L.Map | null>(null)
  const overlayLayerRef = React.useRef<L.Layer | null>(null)

  const pinIcon = React.useMemo(() => createListingPinIcon(), [])
  const exactPosition: [number, number] = React.useMemo(() => [latitude, longitude], [latitude, longitude])
  const offCenterCenter: [number, number] = React.useMemo(
    () => [latitude + 0.0009, longitude - 0.0008],
    [latitude, longitude],
  )

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`

  // Initialize Leaflet map safely once on mount
  React.useEffect(() => {
    const container = mapContainerRef.current
    if (!container) return

    // Clean up any stale leaflet ID on the container DOM element
    if ((container as unknown as { _leaflet_id?: number })._leaflet_id) {
      delete (container as unknown as { _leaflet_id?: number })._leaflet_id
    }

    const initialCenter = activeMode === "EXACT" ? exactPosition : offCenterCenter
    const initialZoom = activeMode === "EXACT" ? 15 : 14

    const map = L.map(container, {
      center: initialCenter,
      zoom: initialZoom,
      scrollWheelZoom: false,
    })
    mapInstanceRef.current = map

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    const resizeTimer = setTimeout(() => {
      map.invalidateSize()
    }, 200)

    return () => {
      clearTimeout(resizeTimer)
      map.remove()
      mapInstanceRef.current = null
      if (container && (container as unknown as { _leaflet_id?: number })._leaflet_id) {
        delete (container as unknown as { _leaflet_id?: number })._leaflet_id
      }
    }
  }, [exactPosition, offCenterCenter]) // eslint-disable-line react-hooks/exhaustive-deps

  // Synchronize overlay layer and map view when activeMode changes without re-mounting the container
  React.useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    if (overlayLayerRef.current) {
      map.removeLayer(overlayLayerRef.current)
      overlayLayerRef.current = null
    }

    if (activeMode === "EXACT") {
      map.setView(exactPosition, 15, { animate: true })
      const marker = L.marker(exactPosition, { icon: pinIcon }).addTo(map)
      overlayLayerRef.current = marker
    } else {
      map.setView(offCenterCenter, 14, { animate: true })
      const circle = L.circle(offCenterCenter, {
        radius: 260,
        color: "var(--primary)",
        fillColor: "var(--primary)",
        fillOpacity: 0.14,
        weight: 2,
        dashArray: "5 5",
      }).addTo(map)
      overlayLayerRef.current = circle
    }
  }, [activeMode, exactPosition, offCenterCenter, pinIcon])

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
            <MapPin className="size-4 text-primary" />
            {dict.listing.locationOnMap}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {address}, {area}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* DEC-009: User toggle between exact pin and nearby area radius circle */}
          <div className="flex items-center rounded-xl bg-muted p-1 border border-border/60">
            <button
              type="button"
              onClick={() => setActiveMode("APPROXIMATE")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                activeMode === "APPROXIMATE"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <CircleDot className="size-3.5 text-primary" />
              <span>{dict.listing.nearbyArea ?? "Nearby Area"}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode("EXACT")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                activeMode === "EXACT"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Compass className="size-3.5 text-primary" />
              <span>{dict.listing.exactLocation ?? "Exact Pin"}</span>
            </button>
          </div>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-medium h-9">
              <ExternalLink className="size-3.5" />
              {dict.listing.openInGoogleMaps}
            </Button>
          </a>
        </div>
      </div>

      <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden border border-border shadow-xs">
        <div ref={mapContainerRef} className="w-full h-full z-0" />
      </div>

      <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/40 border border-border/70 text-xs text-muted-foreground">
        <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
        <p>
          {activeMode === "EXACT"
            ? (dict.listing.exactPinNote ?? "Exact pinpoint location provided by the host.")
            : (dict.listing.nearbyAreaNote ?? "Off-centered circle provides general neighborhood reference while protecting resident privacy.")}
        </p>
      </div>
    </div>
  )
}
