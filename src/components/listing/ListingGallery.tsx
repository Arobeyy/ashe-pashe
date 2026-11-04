"use client"

import * as React from "react"
import Image from "next/image"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Expand, ImageOff, ChevronLeft, ChevronRight } from "lucide-react"
import type { PhotoItem } from "@/types"
import type { Dictionary } from "@/app/[lang]/dictionaries"

type ListingGalleryProps = {
  photos: PhotoItem[]
  title: string
  dict: Dictionary
}

export function ListingGallery({ photos, title, dict }: ListingGalleryProps) {
  const [api, setApi] = React.useState<CarouselApi>()
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [lightboxOpen, setLightboxOpen] = React.useState(false)
  const [lightboxIndex, setLightboxIndex] = React.useState(0)

  React.useEffect(() => {
    if (!api) return
    const onSelect = () => {
      setCurrentIndex(api.selectedScrollSnap())
    }
    api.on("select", onSelect)
    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  const total = photos.length

  if (total === 0) {
    return (
      <div className="relative aspect-video w-full rounded-2xl bg-muted/60 border border-border flex flex-col items-center justify-center text-muted-foreground p-6">
        <ImageOff className="size-12 mb-2 opacity-50" />
        <p className="text-sm font-medium">No photos provided for this listing</p>
      </div>
    )
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  return (
    <div className="space-y-3 w-full">
      {/* Primary Carousel */}
      <div className="relative rounded-2xl overflow-hidden border border-border bg-card shadow-xs group">
        <Carousel setApi={setApi} className="w-full">
          <CarouselContent>
            {photos.map((photo, idx) => (
              <CarouselItem key={photo.id || idx}>
                <div
                  className="relative aspect-video w-full cursor-pointer bg-muted/30 overflow-hidden"
                  onClick={() => openLightbox(idx)}
                >
                  <Image
                    src={photo.imageUrl}
                    alt={`${title} - Photo ${idx + 1}`}
                    fill
                    priority={idx === 0}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 800px"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {total > 1 && (
            <>
              <CarouselPrevious className="left-3 bg-background/80 backdrop-blur-xs hover:bg-background border-border" />
              <CarouselNext className="right-3 bg-background/80 backdrop-blur-xs hover:bg-background border-border" />
            </>
          )}
        </Carousel>

        {/* Counter Badge */}
        <div className="absolute bottom-3 left-3 pointer-events-none">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur-xs text-foreground font-semibold shadow-xs">
            {currentIndex + 1} / {total}
          </Badge>
        </div>

        {/* Fullscreen Button */}
        <Button
          variant="secondary"
          size="icon"
          onClick={() => openLightbox(currentIndex)}
          className="absolute bottom-3 right-3 size-9 rounded-full bg-background/90 backdrop-blur-xs hover:bg-background shadow-xs text-foreground"
          aria-label="View fullscreen gallery"
        >
          <Expand className="size-4" />
        </Button>
      </div>

      {/* Thumbnails strip for desktop & tablet */}
      {total > 1 && (
        <div className="hidden sm:flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {photos.map((photo, idx) => {
            const isSelected = idx === currentIndex
            return (
              <button
                key={photo.id || idx}
                type="button"
                onClick={() => {
                  api?.scrollTo(idx)
                  setCurrentIndex(idx)
                }}
                className={`relative shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                  isSelected ? "border-primary ring-2 ring-primary/30" : "border-border/70 opacity-70 hover:opacity-100"
                }`}
                aria-label={`Go to photo ${idx + 1}`}
              >
                <Image
                  src={photo.imageUrl}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            )
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-background/95 border-border">
          <DialogTitle className="sr-only">
            {title} - Gallery Photo {lightboxIndex + 1} of {total}
          </DialogTitle>
          <div className="relative aspect-4/3 sm:aspect-16/10 max-h-[80vh] w-full bg-black/90 flex items-center justify-center">
            <Image
              src={photos[lightboxIndex]?.imageUrl || ""}
              alt={`${title} - Photo ${lightboxIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
            />

            {total > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 hover:bg-background"
                  onClick={() => setLightboxIndex((prev) => (prev > 0 ? prev - 1 : total - 1))}
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="size-5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 hover:bg-background"
                  onClick={() => setLightboxIndex((prev) => (prev < total - 1 ? prev + 1 : 0))}
                  aria-label="Next photo"
                >
                  <ChevronRight className="size-5" />
                </Button>
              </>
            )}

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
              <Badge variant="secondary" className="bg-background/90 text-foreground font-semibold">
                {lightboxIndex + 1} / {total}
              </Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

