"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthTabs } from "@/components/auth/AuthTabs"
import type { Dictionary } from "@/app/[lang]/dictionaries"

type AuthCardProps = {
  lang: string
  dict: Dictionary
  defaultTab?: "login" | "register"
  from?: string
}

export function AuthCard({ lang, dict, defaultTab = "login", from }: AuthCardProps) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-8 md:py-16">
      <Card className="w-full max-w-md border-border shadow-sm">
        <CardHeader className="text-center space-y-2 pb-2">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl shadow-xs">
            আ
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {dict.common.appName}
          </CardTitle>
          <CardDescription className="text-sm">
            {dict.common.tagline}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <AuthTabs
            lang={lang}
            dict={dict}
            defaultTab={defaultTab}
            from={from}
          />
        </CardContent>
      </Card>
    </div>
  )
}

