"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"
import { Navigation, LocateFixed, Eye } from "lucide-react"
import type { ListingCard as ListingCardType } from "@/types"
import type { Dictionary } from "@/app/[lang]/dictionaries"

type SearchMapProps = {
  center: [number, number] | null
  radiusKm: number
  listings: ListingCardType[]
  onCenterChange: (lat: number, lng: number) => void
  lang: string
  dict: Dictionary
  hoveredListingId?: string | null
  className?: string
}

const DHAKA_DEFAULT: [number, number] = [23.8103, 90.4125]

// Custom SVG-based div icons eliminate external image asset network dependencies
const createCenterIcon = () =>
  L.divIcon({
    className: "custom-map-center-pin",
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: grab;">
        <span style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background-color: var(--primary); opacity: 0.3; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; width: 20px; height: 20px; border-radius: 9999px; background-color: var(--primary); border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center;">
          <div style="width: 6px; height: 6px; border-radius: 9999px; background-color: white;"></div>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })

const createListingIcon = (price: number, isHovered: boolean) => {
  const formatted = price >= 1000 ? `৳${(price / 1000).toFixed(price % 1000 === 0 ? 0 : 1)}k` : `৳${price}`
  const background = isHovered ? "var(--primary)" : "var(--card)"
  const color = isHovered ? "var(--primary-foreground)" : "var(--card-foreground)"
  const border = isHovered ? "2px solid var(--primary-foreground)" : "1px solid var(--border)"
  const scale = isHovered ? "scale(1.15)" : "scale(1)"
  const zIndex = isHovered ? "999" : "1"

  return L.divIcon({
    className: "custom-listing-pin",
    html: `
      <div style="background-color: ${background}; color: ${color}; border: ${border}; transform: ${scale}; z-index: ${zIndex}; padding: 3px 8px; border-radius: 9999px; font-weight: 700; font-size: 11px; box-shadow: 0 4px 8px rgba(0,0,0,0.15); transition: all 150ms ease; display: flex; align-items: center; justify-content: center; white-space: nowrap; cursor: pointer;">
        ${formatted}
      </div>
    `,
    iconSize: [48, 24],
    iconAnchor: [24, 12],
  })
}

// Dynamically pans map viewport when target center point changes
function MapViewController({ center }: { center: [number, number] }) {
  const map = useMap()
  React.useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true })
  }, [center, map])
  return null
}

// Listens to map clicks to set or move the search center pin
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function SearchMap({
  center,
  radiusKm,
  listings,
  onCenterChange,
  lang,
  dict,
  hoveredListingId,
  className = "",
}: SearchMapProps) {
  const [isLocating, setIsLocating] = React.useState(false)
  const mapCenter = center || DHAKA_DEFAULT
  const centerMarkerRef = React.useRef<L.Marker>(null)

  const centerMarkerEvents = React.useMemo(
    () => ({
      dragend() {
        const marker = centerMarkerRef.current
        if (marker) {
          const latLng = marker.getLatLng()
          onCenterChange(latLng.lat, latLng.lng)
        }
      },
    }),
    [onCenterChange],
  )

  const handleLocateMe = () => {
    if (!navigator.geolocation) return
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false)
        onCenterChange(pos.coords.latitude, pos.coords.longitude)
      },
      () => {
        setIsLocating(false)
      },
      { timeout: 10000, enableHighAccuracy: true },
    )
  }

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      <MapContainer
        center={mapCenter}
        zoom={center ? 14 : 12}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapViewController center={mapCenter} />
        <MapClickHandler onMapClick={onCenterChange} />

        {/* Center pin and visual search radius indicator */}
        {center && (
          <>
            <Marker
              position={center}
              draggable={true}
              icon={createCenterIcon()}
              ref={centerMarkerRef}
              eventHandlers={centerMarkerEvents}
            >
              <Popup>
                <div className="p-3 text-xs space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Navigation className="size-3.5 text-primary" />
                    <span>{dict?.search?.pinLocation ?? "Search Center"}</span>
                  </div>
                  <p className="text-muted-foreground">
                    {dict?.search?.dragPinTip ?? "Drag pin or click map to move center."}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground pt-1">
                    {center[0].toFixed(4)}, {center[1].toFixed(4)} ({radiusKm} km)
                  </p>
                </div>
              </Popup>
            </Marker>

            <Circle
              center={center}
              radius={radiusKm * 1000}
              pathOptions={{
                color: "var(--primary)",
                fillColor: "var(--primary)",
                fillOpacity: 0.12,
                weight: 1.5,
                dashArray: "4 4",
              }}
            />
          </>
        )}

        {/* Accommodation listing markers */}
        {listings.map((listing) => {
          const isHovered = hoveredListingId === listing.id
          const photo = listing.photos && listing.photos.length > 0 ? listing.photos[0].imageUrl : null
          const detailUrl = `/${lang}/listings/${listing.id}`

          return (
            <Marker
              key={listing.id}
              position={[listing.latitude, listing.longitude]}
              icon={createListingIcon(listing.monthlyRent, isHovered)}
            >
              <Popup>
                <div className="w-56 overflow-hidden bg-card text-card-foreground">
                  {photo ? (
                    <div className="relative aspect-video w-full overflow-hidden bg-muted">
                      <Image
                        src={photo}
                        alt={listing.title}
                        fill
                        sizes="224px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video w-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                      No Photo
                    </div>
                  )}

                  <div className="p-3 space-y-2">
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="font-bold text-sm text-foreground">
                        ৳{listing.monthlyRent.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {dict?.listing?.perMonth ?? "/ month"}
                      </span>
                    </div>

                    <h4 className="font-medium text-xs line-clamp-1 text-foreground">
                      {listing.title}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border">
                      <span className="truncate max-w-[120px]">{listing.area}</span>
                      {listing.distanceKm !== undefined && (
                        <span className="text-primary font-medium">
                          {listing.distanceKm.toFixed(1)} km
                        </span>
                      )}
                    </div>

                    <Link
                      href={detailUrl}
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-primary py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Eye className="size-3.5" />
                      <span>{dict?.listing?.viewDetails ?? "View Details"}</span>
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Floating GPS button */}
      <button
        type="button"
        onClick={handleLocateMe}
        disabled={isLocating}
        title={dict?.search?.useMyLocation ?? "Use my location"}
        aria-label={dict?.search?.useMyLocation ?? "Use my location"}
        className="absolute bottom-4 right-4 z-[400] flex size-10 items-center justify-center rounded-full bg-card text-foreground shadow-md border border-border hover:bg-muted transition-colors disabled:opacity-50"
      >
        <LocateFixed className={`size-4.5 ${isLocating ? "animate-spin text-primary" : "text-foreground"}`} />
      </button>
    </div>
  )
}

