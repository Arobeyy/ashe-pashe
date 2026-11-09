"use client"

import * as React from "react"
import Link from "next/link"
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
  Lock,
} from "lucide-react"
import type { ListingDetail } from "@/types"
import type { Dictionary } from "@/app/[lang]/dictionaries"

type OwnerCardProps = {
  owner: ListingDetail["owner"]
  currentUserId?: string
  lang: string
  dict: Dictionary
}

export function OwnerCard({ owner, currentUserId, lang, dict }: OwnerCardProps) {
  const [contactOpen, setContactOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const isContactAllowed = owner.showContactInfo !== false
  const rawPhone = owner.phone || "01712345678"
  const formattedPhone = rawPhone.startsWith("+88") ? rawPhone : `+880 ${rawPhone.replace(/^0/, "")}`

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(rawPhone)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleScrollToComments = () => {
    setContactOpen(false)
    const el = document.getElementById("comments")
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
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

      {/* DEC-010: Action-gated contact button (login required if host allows contact info) */}
      {!isContactAllowed ? (
        <Button
          variant="outline"
          className="w-full h-11 text-sm font-semibold rounded-xl border-border text-muted-foreground hover:text-foreground"
          onClick={() => setContactOpen(true)}
        >
          <MessageSquare className="size-4 mr-2 text-primary" />
          {dict.listing.contactPrivateAction ?? "View Questions & Comments"}
        </Button>
      ) : (
        <ActionGate onUnauthenticated={() => {}}>
          <Button
            variant="outline"
            className="w-full h-11 text-sm font-semibold rounded-xl border-primary/20 hover:bg-primary/5 hover:text-primary"
            onClick={() => setContactOpen(true)}
          >
            <Phone className="size-4 mr-2" />
            {dict.listing.contactOwner}
          </Button>
        </ActionGate>
      )}

      {/* Contact Host Dialog */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="max-w-md p-6 bg-card border-border">
          {!isContactAllowed ? (
            <div className="space-y-4 py-2">
              <DialogHeader className="space-y-2">
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Lock className="size-5 text-primary" />
                  {dict.listing.contactPrivateTitle ?? "Host Contact Preference"}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  {dict.listing.contactPrivateDesc ??
                    "This host prefers to communicate via public comments on this listing. Direct contact details are kept private."}
                </DialogDescription>
              </DialogHeader>

              <Button
                onClick={handleScrollToComments}
                className="w-full h-11 font-semibold rounded-xl gap-2 bg-primary text-primary-foreground"
              >
                <MessageSquare className="size-4" />
                <span>{dict.listing.contactPrivateAction ?? "Go to Questions & Comments"}</span>
              </Button>
            </div>
          ) : (
            <>
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

