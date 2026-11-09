import { redirect } from "next/navigation"
import { getDictionary } from "../dictionaries"
import { getSession } from "@/lib/auth"
import { getUserConversations } from "@/lib/conversations"
import { MessagesInbox } from "@/components/messages/MessagesInbox"

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const [session, dict] = await Promise.all([
    getSession(),
    getDictionary(lang),
  ])

  if (!session) {
    redirect(`/${lang}/login?from=${encodeURIComponent(`/${lang}/messages`)}`)
  }

  const initialConversations = await getUserConversations(session.userId)

  return (
    <MessagesInbox
      initialConversations={initialConversations}
      currentUserId={session.userId}
      lang={lang}
      dict={dict}
    />
  )
}
