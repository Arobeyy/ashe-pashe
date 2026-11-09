import { redirect } from "next/navigation"
import { getDictionary } from "../../dictionaries"
import { getSession } from "@/lib/auth"
import { getUserConversations } from "@/lib/conversations"
import { MessagesInbox } from "@/components/messages/MessagesInbox"

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>
}) {
  const { lang, id } = await params
  const [session, dict] = await Promise.all([
    getSession(),
    getDictionary(lang),
  ])

  if (!session) {
    redirect(`/${lang}/login?from=${encodeURIComponent(`/${lang}/messages/${id}`)}`)
  }

  const initialConversations = await getUserConversations(session.userId)

  return (
    <MessagesInbox
      initialConversations={initialConversations}
      activeConversationId={id}
      currentUserId={session.userId}
      lang={lang}
      dict={dict}
    />
  )
}
