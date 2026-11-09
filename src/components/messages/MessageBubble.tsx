"use client"

import * as React from "react"
import Image from "next/image"
import { Check, CheckCheck, ZoomIn } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { MessageItem } from "@/types"

type MessageBubbleProps = {
  message: MessageItem
  isCurrentUser: boolean
  lang: string
}

function formatMessageTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  } catch {
    return ""
  }
}

export function MessageBubble({ message, isCurrentUser, lang }: MessageBubbleProps) {
  const [lightboxOpen, setLightboxOpen] = React.useState(false)
  const timeStr = formatMessageTime(message.createdAt)

  return (
    <div
      className={cn(
        "flex flex-col max-w-[82%] sm:max-w-[70%]",
        isCurrentUser ? "ml-auto items-end" : "mr-auto items-start",
      )}
    >
      <div
        className={cn(
          "rounded-2xl px-3.5 py-2.5 shadow-2xs space-y-2 text-sm break-words",
          isCurrentUser
            ? "bg-primary text-primary-foreground rounded-tr-xs"
            : "bg-muted text-foreground rounded-tl-xs",
        )}
      >
        {/* Photo attachment preview */}
        {message.photoUrl && (
          <div className="relative overflow-hidden rounded-xl bg-black/10 border border-black/5 group cursor-pointer">
            <div
              className="relative aspect-4/3 w-64 max-w-full overflow-hidden"
              onClick={() => setLightboxOpen(true)}
            >
              <Image
                src={message.photoUrl}
                alt="Shared photo"
                fill
                sizes="(max-width: 640px) 250px, 320px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ZoomIn className="size-6 text-white drop-shadow-md" />
              </div>
            </div>
          </div>
        )}

        {/* Text content */}
        {message.content && (
          <p className="whitespace-pre-wrap leading-relaxed select-text">
            {message.content}
          </p>
        )}

        {/* Timestamp and delivery status */}
        <div
          className={cn(
            "flex items-center justify-end gap-1 text-xs opacity-75 select-none pt-0.5",
            isCurrentUser ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          <span>{timeStr}</span>
          {isCurrentUser && (
            <span>
              {message.isRead ? (
                <CheckCheck className="size-3.5 text-primary-foreground" />
              ) : (
                <Check className="size-3.5 text-primary-foreground/70" />
              )}
            </span>
          )}
        </div>
      </div>

      {/* Lightbox dialog for viewing full photo */}
      {message.photoUrl && (
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-3xl p-2 bg-background/95 border-border backdrop-blur-md">
            <DialogTitle className="sr-only">Shared Photo</DialogTitle>
            <div className="relative aspect-4/3 sm:aspect-16/10 w-full overflow-hidden rounded-lg">
              <Image
                src={message.photoUrl}
                alt="Shared photo enlarged"
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
