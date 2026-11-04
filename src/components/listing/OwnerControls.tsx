"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Shield,
  CheckCircle,
  EyeOff,
  Eye,
  Trash2,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import type { AvailabilityStatus, ListingDetail } from "@/types"
import type { Dictionary } from "@/app/[lang]/dictionaries"

type OwnerControlsProps = {
  listing: ListingDetail
  currentUserId?: string
  currentUserRole?: string
  lang: string
  dict: Dictionary
  onStatusChange?: (newStatus: AvailabilityStatus) => void
}

export function OwnerControls({
  listing,
  currentUserId,
  currentUserRole,
  lang,
  dict,
  onStatusChange,
}: OwnerControlsProps) {
  const router = useRouter()
  const [currentStatus, setCurrentStatus] = React.useState<AvailabilityStatus>(listing.availabilityStatus)
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)

  const isOwner = currentUserId === listing.ownerId
  const isAdmin = currentUserRole === "ADMIN"

  if (!isOwner && !isAdmin) {
    return null
  }

  const handleUpdateStatus = async (newStatus: AvailabilityStatus) => {
    try {
      setIsUpdating(true)
      setMessage(null)
      const res = await fetch(`/api/listings/${listing.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availabilityStatus: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        setCurrentStatus(newStatus)
        if (onStatusChange) onStatusChange(newStatus)
        setMessage(dict.listing.statusUpdated)
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage(data.error || "Failed to update status")
      }
    } catch {
      setMessage("Network error")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteListing = async () => {
    try {
      setIsDeleting(true)
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (data.success) {
        setDeleteOpen(false)
        router.push(`/${lang}`)
      } else {
        setMessage(data.error || "Failed to delete listing")
      }
    } catch {
      setMessage("Network error")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="p-5 rounded-2xl border border-primary/20 bg-primary/5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">{dict.listing.ownerControls}</h3>
        </div>
        <Badge variant={currentStatus === "AVAILABLE" ? "default" : "secondary"} className="text-xs">
          {dict.listing[currentStatus.toLowerCase() as "available" | "rented" | "hidden" | "unavailable"] || currentStatus}
        </Badge>
      </div>

      {message && (
        <p className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-lg">
          {message}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {currentStatus === "AVAILABLE" ? (
          <Button
            size="sm"
            variant="outline"
            disabled={isUpdating}
            onClick={() => handleUpdateStatus("RENTED")}
            className="w-full justify-start text-xs font-semibold gap-2 border-border bg-card hover:bg-muted"
          >
            {isUpdating ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle className="size-3.5 text-emerald-600" />}
            {dict.listing.markRented}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={isUpdating}
            onClick={() => handleUpdateStatus("AVAILABLE")}
            className="w-full justify-start text-xs font-semibold gap-2 border-border bg-card hover:bg-muted"
          >
            {isUpdating ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle className="size-3.5 text-primary" />}
            {dict.listing.markAvailable}
          </Button>
        )}

        {currentStatus === "HIDDEN" ? (
          <Button
            size="sm"
            variant="outline"
            disabled={isUpdating}
            onClick={() => handleUpdateStatus("AVAILABLE")}
            className="w-full justify-start text-xs font-semibold gap-2 border-border bg-card hover:bg-muted"
          >
            {isUpdating ? <Loader2 className="size-3.5 animate-spin" /> : <Eye className="size-3.5 text-primary" />}
            {dict.listing.unhideListing}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={isUpdating}
            onClick={() => handleUpdateStatus("HIDDEN")}
            className="w-full justify-start text-xs font-semibold gap-2 border-border bg-card hover:bg-muted"
          >
            {isUpdating ? <Loader2 className="size-3.5 animate-spin" /> : <EyeOff className="size-3.5 text-muted-foreground" />}
            {dict.listing.hideListing}
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={() => setDeleteOpen(true)}
          className="w-full justify-start text-xs font-semibold gap-2 text-destructive border-destructive/20 hover:bg-destructive/10"
        >
          <Trash2 className="size-3.5" />
          {dict.listing.deleteListing}
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md p-6 bg-card border-border">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              {dict.listing.deleteListing}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {dict.listing.deleteListingConfirm}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 sm:justify-end mt-4">
            <Button
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDeleteListing}
              className="gap-1.5"
            >
              {isDeleting && <Loader2 className="size-4 animate-spin" />}
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

