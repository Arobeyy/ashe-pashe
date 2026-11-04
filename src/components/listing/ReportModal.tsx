"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Flag, Loader2, CheckCircle2 } from "lucide-react"
import type { ReportReason } from "@/types"
import type { Dictionary } from "@/app/[lang]/dictionaries"

type ReportModalProps = {
  listingId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  dict: Dictionary
}

const REPORT_REASONS: ReportReason[] = [
  "SCAM",
  "INACCURATE",
  "NO_LONGER_AVAILABLE",
  "DUPLICATE",
  "INAPPROPRIATE",
  "OTHER",
]

export function ReportModal({
  listingId,
  open,
  onOpenChange,
  dict,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = React.useState<ReportReason>("SCAM")
  const [details, setDetails] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      setErrorMessage(null)

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          reason: selectedReason,
          details: details.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setSubmitted(true)
        setTimeout(() => {
          setSubmitted(false)
          setDetails("")
          onOpenChange(false)
        }, 2200)
      } else {
        setErrorMessage(data.error || "Failed to submit report")
      }
    } catch {
      setErrorMessage("Network error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-card border-border">
        {submitted ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <CheckCircle2 className="size-6" />
            </div>
            <DialogTitle className="text-lg font-bold">
              {dict.listing.reportSuccess}
            </DialogTitle>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Flag className="size-4 text-destructive" />
                {dict.listing.reportTitle}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {dict.listing.reportSubtitle}
              </DialogDescription>
            </DialogHeader>

            {errorMessage && (
              <p className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg">
                {errorMessage}
              </p>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">
                {dict.listing.reportReason}
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {REPORT_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      selectedReason === reason
                        ? "border-primary bg-primary/5 font-semibold text-foreground"
                        : "border-border/70 hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={() => setSelectedReason(reason)}
                      className="accent-primary"
                    />
                    <span>{dict.listing.reportReasons[reason]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">
                {dict.listing.reportDetailsLabel}
              </label>
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={dict.listing.reportDetailsPlaceholder}
                className="text-xs min-h-20 resize-none bg-background border-border"
                maxLength={500}
              />
            </div>

            <DialogFooter className="flex gap-2 sm:justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
              >
                {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
                {dict.listing.submitReport}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

