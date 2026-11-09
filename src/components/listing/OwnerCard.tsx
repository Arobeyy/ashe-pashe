"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ActionGate } from "@/components/auth/ActionGate"
import {
  User,
  GraduationCap,
  Briefcase,
  Phone,
  Mail,
  Copy,
  Check,
  ShieldAlert,
  MessageSquare,
  MessageCircle,
  Lock,
  Loader2,
} from "lucide-react"
import type { ListingDetail } from "@/types"
import type { Dictionary } from "@/app/[lang]/dictionaries"

type OwnerCardProps = {
  owner: ListingDetail["owner"]
  listingId?: string
  currentUserId?: string
  lang: string
  dict: Dictionary
}

export function OwnerCard({ owner, listingId, currentUserId, lang, dict }: OwnerCardProps) {
  const router = useRouter()
  const [contactOpen, setContactOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [isStartingChat, setIsStartingChat] = React.useState(false)

  const isContactAllowed = owner.showContactInfo !== false
  const isOwner = currentUserId === owner.id
  const rawPhone = owner.phone || "01712345678"
  const formattedPhone = rawPhone.startsWith("+88") ? rawPhone : `+880 ${rawPhone.replace(/^0/, "")}`

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(rawPhone)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
          recipientId: owner.id,
          listingId,
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

  return (
    <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {dict.listing.postedBy}
        </span>
        <Link
          href={`/${lang}/profile/${owner.id}`}
          className="text-xs font-semibold text-primary hover:underline"
        >
          View Profile
        </Link>
      </div>

      <div className="flex items-center gap-3.5">
        <Link href={`/${lang}/profile/${owner.id}`}>
          <Avatar className="size-13 border-2 border-border/80">
            <AvatarImage src={owner.avatarUrl || undefined} alt={owner.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
              {owner.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="space-y-0.5 min-w-0">
          <Link
            href={`/${lang}/profile/${owner.id}`}
            className="text-base font-semibold text-foreground hover:text-primary transition-colors truncate block"
          >
            {owner.name}
          </Link>

          {owner.occupation && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
              <Briefcase className="size-3.5 shrink-0 text-muted-foreground" />
              <span>{owner.occupation}</span>
            </p>
          )}

          {owner.education && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
              <GraduationCap className="size-3.5 shrink-0 text-muted-foreground" />
              <span>{owner.education}</span>
            </p>
          )}
        </div>
      </div>

      {/* DEC-012: Conditional contact actions based on host profile preferences */}
      {!isOwner && (
        <div className="space-y-2 pt-1">
          <Button
            className="w-full h-11 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-xs"
            onClick={handleStartChat}
            disabled={isStartingChat}
          >
            {isStartingChat ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MessageCircle className="size-4" />
            )}
            <span>{dict.listing.messageHost ?? "Message Host"}</span>
          </Button>

          {isContactAllowed && (
            <ActionGate onUnauthenticated={() => {}}>
              <Button
                variant="outline"
                className="w-full h-11 text-sm font-semibold rounded-xl border-border hover:bg-accent gap-2"
                onClick={() => setContactOpen(true)}
              >
                <Phone className="size-4" />
                <span>{dict.listing.contactOwner ?? "Contact / Call"}</span>
              </Button>
            </ActionGate>
          )}
        </div>
      )}

      {/* Contact Host Dialog */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="max-w-md p-6 bg-card border-border">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Phone className="size-5 text-primary" />
              {dict.listing.contactTitle}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {dict.listing.contactDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl border border-border bg-muted/30 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{dict.listing.phoneLabel}</p>
                <p className="text-base font-bold text-foreground mt-0.5 tracking-wide">
                  {formattedPhone}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyPhone}
                  className="gap-1.5"
                >
                  {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
                  {copied ? dict.listing.copied : dict.listing.copyPhone}
                </Button>
                <a href={`tel:${rawPhone}`}>
                  <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground font-semibold">
                    <Phone className="size-3.5" />
                    {dict.listing.callNow}
                  </Button>
                </a>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs flex gap-2.5">
              <ShieldAlert className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <p>
                Safety reminder: Never make advance deposits or money transfers before viewing the property in person and verifying identity.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

