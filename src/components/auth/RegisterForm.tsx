"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, Briefcase, ChevronDown, Loader2, Lock, Mail, Phone, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import type { ApiResponse, UserPublic } from "@/types"
import type { Dictionary } from "@/app/[lang]/dictionaries"

type RegisterFormProps = {
  lang: string
  dict: Dictionary
  from?: string
}

export function RegisterForm({ lang, dict, from }: RegisterFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resolvedFrom = from ?? searchParams.get("from") ?? undefined
  const { setUser } = useCurrentUser()

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [occupation, setOccupation] = React.useState("Student")
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  // Resolves safe post-registration destination URL
  const getDestinationUrl = React.useCallback(() => {
    if (!resolvedFrom) return `/${lang}`
    if (resolvedFrom.startsWith(`/${lang}`)) return resolvedFrom
    if (resolvedFrom.startsWith("/")) return `/${lang}${resolvedFrom}`
    return `/${lang}`
  }, [resolvedFrom, lang])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!name.trim() || !email.trim() || !password) {
      setError(dict.auth?.errors?.requiredFields ?? "Please fill in all required fields")
      return
    }

    if (password.length < 6) {
      setError(dict.auth?.errors?.passwordTooShort ?? "Password must be at least 6 characters")
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim() || undefined,
          occupation,
        }),
      })

      const data = (await res.json()) as ApiResponse<UserPublic>

      if (!res.ok || !data.success || !data.data) {
        setError(data.error ?? dict.auth?.errors?.generic ?? "Something went wrong. Please try again.")
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

  const loginHref = resolvedFrom
    ? `/${lang}/login?from=${encodeURIComponent(resolvedFrom)}`
    : `/${lang}/login`

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-8 md:py-16">
      <Card className="w-full max-w-md border-border shadow-sm">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl shadow-xs">
            আ
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {dict.auth?.createAccount ?? "Create an account"}
          </CardTitle>
          <CardDescription className="text-sm">
            {dict.auth?.registerSubtitle ?? "Join Ashepashe to find or share student housing"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
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
                htmlFor="register-name"
                className="text-sm font-medium text-foreground flex items-center gap-1.5"
              >
                <User className="size-3.5 text-muted-foreground" />
                {dict.auth?.name ?? "Full Name"}
              </label>
              <Input
                id="register-name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={dict.auth?.namePlaceholder ?? "e.g. Rahat Ahmed"}
                className="h-11 px-3 text-sm"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="register-email"
                className="text-sm font-medium text-foreground flex items-center gap-1.5"
              >
                <Mail className="size-3.5 text-muted-foreground" />
                {dict.auth?.email ?? "Email address"}
              </label>
              <Input
                id="register-email"
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
                htmlFor="register-password"
                className="text-sm font-medium text-foreground flex items-center gap-1.5"
              >
                <Lock className="size-3.5 text-muted-foreground" />
                {dict.auth?.password ?? "Password"}
              </label>
              <Input
                id="register-password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={dict.auth?.passwordPlaceholder ?? "At least 6 characters"}
                className="h-11 px-3 text-sm"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="register-phone"
                className="text-sm font-medium text-foreground flex items-center gap-1.5"
              >
                <Phone className="size-3.5 text-muted-foreground" />
                {dict.auth?.phone ?? "Phone number (optional)"}
              </label>
              <Input
                id="register-phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={dict.auth?.phonePlaceholder ?? "017XXXXXXXX"}
                className="h-11 px-3 text-sm"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="register-occupation"
                className="text-sm font-medium text-foreground flex items-center gap-1.5"
              >
                <Briefcase className="size-3.5 text-muted-foreground" />
                {dict.auth?.occupation ?? "Occupation / Role"}
              </label>
              <div className="relative">
                <select
                  id="register-occupation"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  disabled={isLoading}
                  className="h-11 w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                >
                  <option value="Student">
                    {dict.auth?.occupations?.student ?? "Student"}
                  </option>
                  <option value="Job Holder">
                    {dict.auth?.occupations?.jobHolder ?? "Job Holder"}
                  </option>
                  <option value="Landlord">
                    {dict.auth?.occupations?.landlord ?? "Landlord / House Owner"}
                  </option>
                  <option value="Other">
                    {dict.auth?.occupations?.other ?? "Other"}
                  </option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full text-base font-medium shadow-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  {dict.auth?.registering ?? "Creating account..."}
                </>
              ) : (
                (dict.auth?.registerAction ?? "Create Account")
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col items-center justify-center gap-2 border-t border-border pt-4 text-center text-sm text-muted-foreground">
          <div>
            {dict.auth?.hasAccount ?? "Already have an account?"}{" "}
            <Link
              href={loginHref}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {dict.auth?.signInHere ?? "Sign in here"}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
