"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ActionGate } from "@/components/auth/ActionGate"
import {
  MessageSquare,
  Send,
  Trash2,
  Loader2,
  CornerDownRight,
} from "lucide-react"
import type { CommentItem } from "@/types"
import type { Dictionary } from "@/app/[lang]/dictionaries"

type CommentsSectionProps = {
  listingId: string
  initialComments: CommentItem[]
  currentUserId?: string
  currentUserRole?: string
  lang: string
  dict: Dictionary
}

function formatRelativeTime(dateString: string, lang: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return lang === "bn" ? "এইমাত্র" : "Just now"
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return lang === "bn" ? `${diffInMinutes} মিনিট আগে` : `${diffInMinutes}m ago`
  }
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return lang === "bn" ? `${diffInHours} ঘণ্টা আগে` : `${diffInHours}h ago`
  }
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return lang === "bn" ? `${diffInDays} দিন আগে` : `${diffInDays}d ago`
  }
  return date.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", {
    month: "short",
    day: "numeric",
  })
}

export function CommentsSection({
  listingId,
  initialComments,
  currentUserId,
  currentUserRole,
  lang,
  dict,
}: CommentsSectionProps) {
  const [comments, setComments] = React.useState<CommentItem[]>(initialComments)
  const [newContent, setNewContent] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const handlePostComment = async () => {
    const text = newContent.trim()
    if (!text) return

    try {
      setIsSubmitting(true)
      setError(null)

      const res = await fetch(`/api/listings/${listingId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      })

      const data = await res.json()
      if (data.success && data.data) {
        setComments((prev) => [...prev, data.data])
        setNewContent("")
      } else {
        setError(data.error || "Failed to post comment")
      }
    } catch {
      setError("Network error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm(dict.listing.deleteCommentConfirm)) return

    try {
      setDeletingId(commentId)
      const res = await fetch(`/api/listings/${listingId}/comments/${commentId}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (data.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId))
      } else {
        setError(data.error || "Failed to delete comment")
      }
    } catch {
      setError("Network error occurred")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
          <MessageSquare className="size-4 text-primary" />
          {dict.listing.commentsTitle}
        </h2>
        <span className="text-xs font-semibold text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full">
          {comments.length}
        </span>
      </div>

      {error && (
        <p className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg">
          {error}
        </p>
      )}

      {/* Add Comment Form */}
      <div className="p-4 rounded-2xl border border-border bg-card/60 space-y-3">
        <Textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder={dict.listing.addCommentPlaceholder}
          className="text-sm min-h-22 resize-none bg-background border-border"
          maxLength={1000}
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {newContent.length}/1000
          </span>
          <ActionGate onUnauthenticated={() => {}}>
            <Button
              size="sm"
              disabled={isSubmitting || !newContent.trim()}
              onClick={handlePostComment}
              className="gap-1.5 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              {isSubmitting ? dict.listing.postingComment : dict.listing.postComment}
            </Button>
          </ActionGate>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20 space-y-2">
            <CornerDownRight className="size-8 mx-auto text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              {dict.listing.noCommentsYet}
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const canDelete =
              currentUserId === comment.authorId || currentUserRole === "ADMIN"

            return (
              <div
                key={comment.id}
                className="p-4 rounded-xl border border-border bg-card/40 flex items-start justify-between gap-3 shadow-2xs group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <Avatar className="size-9 border border-border/60 shrink-0 mt-0.5">
                    <AvatarImage
                      src={comment.author.avatarUrl || undefined}
                      alt={comment.author.name}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                      {comment.author.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {comment.author.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(comment.createdAt, lang)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed break-words">
                      {comment.content}
                    </p>
                  </div>
                </div>

                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={deletingId === comment.id}
                    onClick={() => handleDeleteComment(comment.id)}
                    className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 opacity-80 group-hover:opacity-100"
                    title={dict.listing.deleteComment}
                  >
                    {deletingId === comment.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </Button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

