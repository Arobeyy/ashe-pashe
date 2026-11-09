"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, User, ShieldCheck } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ListingContextCard } from "@/components/messages/ListingContextCard"
import { MessageBubble } from "@/components/messages/MessageBubble"
import { MessageInput } from "@/components/messages/MessageInput"
import type { ConversationDetail, MessageItem } from "@/types"
import type { Dictionary } from "@/app/[lang]/dictionaries"

type ChatWindowProps = {
  conversationId: string
  currentUserId: string
  lang: string
  dict: Dictionary
  onBack?: () => void
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

function formatDateSeparator(dateStr: string, lang: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    if (isSameDay(date, now)) {
      return lang === "bn" ? "আজ" : "Today"
    }
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (isSameDay(date, yesterday)) {
      return lang === "bn" ? "গতকাল" : "Yesterday"
    }
    return date.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  } catch {
    return ""
  }
}

export function ChatWindow({
  conversationId,
  currentUserId,
  lang,
  dict,
  onBack,
}: ChatWindowProps) {
  const [detail, setDetail] = React.useState<ConversationDetail | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  // Initial fetch and message loading
  React.useEffect(() => {
    let isMounted = true

    const fetchDetail = async (showLoading = false) => {
      if (showLoading) setIsLoading(true)
      try {
        const res = await fetch(`/api/conversations/${conversationId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success && isMounted) {
            setDetail(data.data)
          }
        }
      } catch (err) {
        console.error("Failed to load conversation:", err)
      } finally {
        if (isMounted && showLoading) {
          setIsLoading(false)
          setTimeout(() => scrollToBottom("auto"), 50)
        }
      }
    }

    void fetchDetail(true)

    // Polling interval to check for new messages every 3.5 seconds
    const interval = setInterval(() => void fetchDetail(false), 3500)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [conversationId])

  // Scroll to bottom when message count increases
  React.useEffect(() => {
    if (detail?.messages?.length) {
      scrollToBottom("smooth")
    }
  }, [detail?.messages?.length])

  const handleSendMessage = async (
    content: string,
    photoFile: File | null,
  ): Promise<boolean> => {
    try {
      let res: Response
      if (photoFile) {
        const formData = new FormData()
        if (content) formData.append("content", content)
        formData.append("photo", photoFile)
        res = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: "POST",
          body: formData,
        })
      } else {
        res = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        })
      }

      if (res.ok) {
        const data = await res.json()
        if (data.success && data.data) {
          setDetail((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              messages: [...prev.messages, data.data as MessageItem],
            }
          })
          setTimeout(() => scrollToBottom("smooth"), 50)
          return true
        }
      }
      return false
    } catch (err) {
      console.error("Error sending message:", err)
      return false
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-background p-6 space-y-3 animate-pulse">
        <div className="size-12 rounded-full bg-muted" />
        <div className="h-4 w-32 bg-muted rounded" />
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-background p-6 text-center text-muted-foreground">
        <p className="text-sm font-semibold text-foreground">
          {dict.messages?.noConversations ?? "Conversation not found"}
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/95 backdrop-blur-xs shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="md:hidden size-9 p-0 rounded-lg text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="size-5" />
          </Button>

          <Link
            href={`/${lang}/profile/${detail.otherUser.id}`}
            className="flex items-center gap-2.5 min-w-0 group"
          >
            <Avatar className="size-9 border border-border">
              {detail.otherUser.avatarUrl ? (
                <AvatarImage
                  src={detail.otherUser.avatarUrl}
                  alt={detail.otherUser.name}
                />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                {detail.otherUser.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                {detail.otherUser.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {detail.otherUser.occupation || (dict.messages?.online ?? "Active")}
              </p>
            </div>
          </Link>
        </div>

        <Link href={`/${lang}/profile/${detail.otherUser.id}`}>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs font-semibold rounded-lg border-border"
          >
            <User className="size-3.5 mr-1.5" />
            <span>Profile</span>
          </Button>
        </Link>
      </div>

      {/* Pinned Listing Context Banner (DEC-012 Option A) */}
      {detail.listing && (
        <ListingContextCard listing={detail.listing} lang={lang} dict={dict} />
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Safety banner reminder */}
        <div className="mx-auto max-w-md p-3 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
          <ShieldCheck className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p>
            {dict.messages?.safetyTip ??
              "Safety tip: Protect your contact details and view accommodations safely. Never transfer advance funds before checking the property in person."}
          </p>
        </div>

        {/* Message bubbles grouped by date */}
        {detail.messages.map((message, index) => {
          const isCurrentUser = message.senderId === currentUserId
          const prevMessage = detail.messages[index - 1]
          const showDateSeparator =
            !prevMessage ||
            !isSameDay(new Date(prevMessage.createdAt), new Date(message.createdAt))

          return (
            <React.Fragment key={message.id}>
              {showDateSeparator && (
                <div className="flex items-center justify-center my-3 select-none">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {formatDateSeparator(message.createdAt, lang)}
                  </span>
                </div>
              )}
              <MessageBubble
                message={message}
                isCurrentUser={isCurrentUser}
                lang={lang}
              />
            </React.Fragment>
          )
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <MessageInput onSendMessage={handleSendMessage} dict={dict} />
    </div>
  )
}
