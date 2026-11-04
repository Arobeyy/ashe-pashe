"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, Loader2, Lock, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import type { ApiResponse, UserPublic } from "@/types"
import type { Dictionary } from "@/app/[lang]/dictionaries"

type LoginFormProps = {
  lang: string
  dict: Dictionary
  from?: string
}

export function LoginForm({ lang, dict, from }: LoginFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resolvedFrom = from ?? searchParams.get("from") ?? undefined
  const { setUser } = useCurrentUser()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  // Resolves safe post-login destination URL
  const getDestinationUrl = React.useCallback(() => {
    if (!resolvedFrom) return `/${lang}`
    if (resolvedFrom.startsWith(`/${lang}`)) return resolvedFrom
    if (resolvedFrom.startsWith("/")) return `/${lang}${resolvedFrom}`
    return `/${lang}`
  }, [resolvedFrom, lang])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError(dict.auth?.errors?.requiredFields ?? "Please fill in all required fields")
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const data = (await res.json()) as ApiResponse<UserPublic>

      if (!res.ok || !data.success || !data.data) {
        setError(data.error ?? dict.auth?.errors?.invalidCredentials ?? "Invalid email or password")
        setIsLoading(false)
        return
      }

      setUser(data.data)
      router.push(getDestinationUrl())
      router.refresh()
    } catch {
      setError(dict.auth?.errors?.generic ?? "Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  const registerHref = resolvedFrom
    ? `/${lang}/register?from=${encodeURIComponent(resolvedFrom)}`
    : `/${lang}/register`

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-8 md:py-16">
      <Card className="w-full max-w-md border-border shadow-sm">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl shadow-xs">
            আ
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {dict.auth?.welcomeBack ?? "Welcome back"}
          </CardTitle>
          <CardDescription className="text-sm">
            {dict.auth?.loginSubtitle ?? "Enter your credentials to access your account"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {resolvedFrom ? (
            <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/60 p-3 text-xs text-muted-foreground">
              <AlertCircle className="size-4 shrink-0 text-primary mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-foreground">
                  {dict.auth?.actionGateNotice ?? "Sign in required"}
                </span>
                <span>
                  {dict.auth?.actionGateSubtitle ?? "Please sign in to continue with this action."}
                </span>
              </div>
            </div>
          ) : null}

          {error ? (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="text-sm font-medium text-foreground flex items-center gap-1.5"
              >
                <Mail className="size-3.5 text-muted-foreground" />
                {dict.auth?.email ?? "Email address"}
              </label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={dict.auth?.emailPlaceholder ?? "student@example.com"}
                className="h-11 px-3 text-sm"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="text-sm font-medium text-foreground flex items-center gap-1.5"
              >
                <Lock className="size-3.5 text-muted-foreground" />
                {dict.auth?.password ?? "Password"}
              </label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={dict.auth?.passwordPlaceholder ?? "••••••••"}
                className="h-11 px-3 text-sm"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full text-base font-medium shadow-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  {dict.auth?.loggingIn ?? "Signing in..."}
                </>
              ) : (
                (dict.auth?.loginAction ?? "Sign In")
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col items-center justify-center gap-2 border-t border-border pt-4 text-center text-sm text-muted-foreground">
          <div>
            {dict.auth?.noAccount ?? "Don't have an account?"}{" "}
            <Link
              href={registerHref}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {dict.auth?.registerHere ?? "Register here"}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
