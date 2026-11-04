import { Suspense } from "react"
import type { Metadata } from "next"
import { getDictionary } from "../dictionaries"
import { AuthCard } from "@/components/auth/AuthCard"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  const dict = await getDictionary(lang)
  return {
    title: `${dict.auth?.register ?? "Register"} | ${dict.common.appName}`,
    description: dict.auth?.registerSubtitle ?? "Create an account",
  }
}

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const dict = await getDictionary(lang)

  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center p-8 text-muted-foreground" />}>
      <AuthCard lang={lang} dict={dict} defaultTab="register" />
    </Suspense>
  )
}
