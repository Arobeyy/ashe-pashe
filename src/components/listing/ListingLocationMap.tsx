"use client"

import * as React from "react"
import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet"
import L from "leaflet"
import { MapPin, ExternalLink, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Dictionary } from "@/app/[lang]/dictionaries"

type ListingLocationMapProps = {
  latitude: number
  longitude: number
  area: string
  address: string
  dict: Dictionary
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
}: ListingLocationMapProps) {
  const pinIcon = React.useMemo(() => createListingPinIcon(), [])
  const position: [number, number] = [latitude, longitude]

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
            <MapPin className="size-4 text-primary" />
            {dict.listing.locationOnMap}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{address}, {area}</p>
        </div>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex"
        >
          <Button variant="outline" size="sm" className="gap-1.5 text-xs font-medium">
            <ExternalLink className="size-3.5" />
            {dict.listing.openInGoogleMaps}
          </Button>
        </a>
      </div>

      <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden border border-border shadow-xs">
        <MapContainer
          center={position}
          zoom={15}
          scrollWheelZoom={false}
          className="w-full h-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Circle
            center={position}
            radius={200}
            pathOptions={{
              color: "var(--primary)",
              fillColor: "var(--primary)",
              fillOpacity: 0.12,
              weight: 2,
            }}
          />
          <Marker position={position} icon={pinIcon} />
        </MapContainer>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/40 border border-border/70 text-xs text-muted-foreground">
        <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
        <p>{dict.listing.approximateLocationNote}</p>
      </div>
    </div>
  )
}

