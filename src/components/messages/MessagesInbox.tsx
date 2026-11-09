"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { MessageSquare } from "lucide-react"
import { ConversationList } from "@/components/messages/ConversationList"
import { ChatWindow } from "@/components/messages/ChatWindow"
import type { ConversationSummary } from "@/types"
import type { Dictionary } from "@/app/[lang]/dictionaries"

type MessagesInboxProps = {
  initialConversations: ConversationSummary[]
  activeConversationId?: string
  currentUserId: string
  lang: string
  dict: Dictionary
}

export function MessagesInbox({
  initialConversations,
  activeConversationId,
  currentUserId,
  lang,
  dict,
}: MessagesInboxProps) {
  const router = useRouter()
  const [conversations, setConversations] = React.useState<ConversationSummary[]>(initialConversations)
  const [selectedId, setSelectedId] = React.useState<string | undefined>(activeConversationId)

  React.useEffect(() => {
    setSelectedId(activeConversationId)
  }, [activeConversationId])

  // Periodic poll to refresh conversation list and unread badges
  React.useEffect(() => {
    let isMounted = true

    const refreshList = async () => {
      try {
        const res = await fetch("/api/conversations")
        if (res.ok) {
          const data = await res.json()
          if (data.success && Array.isArray(data.data) && isMounted) {
            setConversations(data.data)
          }
        }
      } catch (err) {
        console.error("Failed to refresh conversations:", err)
      }
    }

    const interval = setInterval(refreshList, 8000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const handleSelectConversation = (id: string) => {
    setSelectedId(id)
  }

  const handleBackToList = () => {
    setSelectedId(undefined)
    router.push(`/${lang}/messages`)
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] md:h-screen overflow-hidden bg-background">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Conversation List */}
        <div
          className={`w-full md:w-80 lg:w-96 shrink-0 h-full ${
            selectedId ? "hidden md:flex flex-col" : "flex flex-col"
          }`}
        >
          <ConversationList
            conversations={conversations}
            activeId={selectedId}
            lang={lang}
            dict={dict}
            onSelectConversation={handleSelectConversation}
          />
        </div>

        {/* Right Column: Chat Window or Placeholder */}
        <div
          className={`flex-1 h-full ${
            selectedId ? "flex flex-col" : "hidden md:flex flex-col"
          }`}
        >
          {selectedId ? (
            <ChatWindow
              conversationId={selectedId}
              currentUserId={currentUserId}
              lang={lang}
              dict={dict}
              onBack={handleBackToList}
            />
          ) : (
            <div className="flex-1 hidden md:flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-muted/10 space-y-3">
              <div className="size-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground shadow-2xs">
                <MessageSquare className="size-8" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-foreground">
                  {dict.messages?.selectConversation ?? "Select a conversation to start chatting"}
                </p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  {dict.messages?.selectConversationDesc ??
                    "Choose a conversation from the left to view messages and photos."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
