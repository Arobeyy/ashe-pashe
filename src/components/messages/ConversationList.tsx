"use client"

import * as React from "react"
import Link from "next/link"
import { Search, MessageSquare, Image as ImageIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { ConversationSummary } from "@/types"
import type { Dictionary } from "@/app/[lang]/dictionaries"

type ConversationListProps = {
  conversations: ConversationSummary[]
  activeId?: string
  lang: string
  dict: Dictionary
  onSelectConversation?: (id: string) => void
}

function formatConversationDate(dateStr: string, lang: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }

    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()

    if (isYesterday) {
      return lang === "bn" ? "গতকাল" : "Yesterday"
    }

    return date.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", {
      month: "short",
      day: "numeric",
    })
  } catch {
    return ""
  }
}

export function ConversationList({
  conversations,
  activeId,
  lang,
  dict,
  onSelectConversation,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredConversations = React.useMemo(() => {
    if (!searchQuery.trim()) return conversations
    const query = searchQuery.toLowerCase()
    return conversations.filter(
      (conv) =>
        conv.otherUser.name.toLowerCase().includes(query) ||
        conv.listing?.title.toLowerCase().includes(query) ||
        conv.lastMessage?.content.toLowerCase().includes(query),
    )
  }, [conversations, searchQuery])

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Header and Search */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-heading text-foreground">
            {dict.messages?.conversations ?? "Conversations"}
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {conversations.length}
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={dict.messages?.searchConversations ?? "Search conversations..."}
            className="pl-9 h-9 text-xs rounded-xl bg-background border-border"
          />
        </div>
      </div>

      {/* Conversation Cards List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/50">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center space-y-3 flex flex-col items-center justify-center h-64 text-muted-foreground">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <MessageSquare className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {dict.messages?.noConversations ?? "No conversations yet"}
              </p>
              <p className="text-xs text-muted-foreground max-w-xs">
                {dict.messages?.noConversationsDesc ??
                  "When you message a host or someone contacts you, the conversation will appear here."}
              </p>
            </div>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = conv.id === activeId
            const isUnread = conv.unreadCount > 0
            const dateStr = formatConversationDate(conv.updatedAt, lang)

            return (
              <Link
                key={conv.id}
                href={`/${lang}/messages/${conv.id}`}
                onClick={() => onSelectConversation?.(conv.id)}
                className={cn(
                  "flex items-start gap-3 p-3.5 transition-colors text-left group hover:bg-accent/50",
                  isActive && "bg-accent text-accent-foreground",
                  isUnread && !isActive && "bg-primary/5",
                )}
              >
                <div className="relative shrink-0">
                  <Avatar className="size-11 border border-border">
                    {conv.otherUser.avatarUrl ? (
                      <AvatarImage
                        src={conv.otherUser.avatarUrl}
                        alt={conv.otherUser.name}
                      />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                      {conv.otherUser.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isUnread && (
                    <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-primary ring-2 ring-card" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <p
                      className={cn(
                        "text-sm truncate",
                        isUnread ? "font-bold text-foreground" : "font-medium text-foreground",
                      )}
                    >
                      {conv.otherUser.name}
                    </p>
                    <span className="text-xs text-muted-foreground shrink-0 font-medium">
                      {dateStr}
                    </span>
                  </div>

                  {conv.listing && (
                    <p className="text-xs text-primary font-medium truncate flex items-center gap-1">
                      <span>•</span>
                      <span>{conv.listing.title}</span>
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground truncate flex-1 flex items-center gap-1">
                      {conv.lastMessage?.photoUrl && !conv.lastMessage?.content ? (
                        <>
                          <ImageIcon className="size-3.5 shrink-0 text-muted-foreground" />
                          <span>{dict.messages?.photo ?? "Photo"}</span>
                        </>
                      ) : (
                        conv.lastMessage?.content || (dict.messages?.startChat ?? "Started a conversation")
                      )}
                    </p>

                    {conv.unreadCount > 0 && (
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
