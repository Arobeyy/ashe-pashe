"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, Briefcase, ChevronDown, Loader2, Lock, Mail, Phone, User } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import type { ApiResponse, UserPublic } from "@/types"
import type { Dictionary } from "@/app/[lang]/dictionaries"

type AuthTabsProps = {
  lang: string
  dict: Dictionary
  defaultTab?: "login" | "register"
  from?: string
  onSuccess?: (user: UserPublic) => void
  isModal?: boolean
}

export function AuthTabs({
  lang,
  dict,
  defaultTab = "login",
  from,
  onSuccess,
  isModal = false,
}: AuthTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resolvedFrom = from ?? searchParams.get("from") ?? undefined
  const { setUser } = useCurrentUser()

  const [activeTab, setActiveTab] = React.useState<"login" | "register">(defaultTab)

  // Login form state
  const [loginEmail, setLoginEmail] = React.useState("")
  const [loginPassword, setLoginPassword] = React.useState("")
  const [loginError, setLoginError] = React.useState<string | null>(null)
  const [isLoginLoading, setIsLoginLoading] = React.useState(false)

  // Register form state
  const [regName, setRegName] = React.useState("")
  const [regEmail, setRegEmail] = React.useState("")
  const [regPassword, setRegPassword] = React.useState("")
  const [regPhone, setRegPhone] = React.useState("")
  const [regOccupation, setRegOccupation] = React.useState("Student")
  const [regError, setRegError] = React.useState<string | null>(null)
  const [isRegLoading, setIsRegLoading] = React.useState(false)

  // Resolves safe post-auth destination URL
  const getDestinationUrl = React.useCallback(() => {
    if (!resolvedFrom) return `/${lang}`
    if (resolvedFrom.startsWith(`/${lang}`)) return resolvedFrom
    if (resolvedFrom.startsWith("/")) return `/${lang}${resolvedFrom}`
    return `/${lang}`
  }, [resolvedFrom, lang])

  const handleTabChange = (val: string) => {
    const nextTab = val as "login" | "register"
    setActiveTab(nextTab)
    // Synchronizes url pathname without page reload for dedicated pages
    if (!isModal && typeof window !== "undefined") {
      const targetPath = `/${lang}/${nextTab}`
      const query = resolvedFrom ? `?from=${encodeURIComponent(resolvedFrom)}` : ""
      window.history.replaceState(null, "", `${targetPath}${query}`)
    }
  }

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoginError(null)

    if (!loginEmail.trim() || !loginPassword) {
      setLoginError(dict.auth?.errors?.requiredFields ?? "Please fill in all required fields")
      return
    }

    setIsLoginLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      })

      const data = (await res.json()) as ApiResponse<UserPublic>

      if (!res.ok || !data.success || !data.data) {
        setLoginError(data.error ?? dict.auth?.errors?.invalidCredentials ?? "Invalid email or password")
        setIsLoginLoading(false)
        return
      }

      setUser(data.data)

      if (onSuccess) {
        onSuccess(data.data)
      } else {
        router.push(getDestinationUrl())
        router.refresh()
      }
    } catch {
      setLoginError(dict.auth?.errors?.generic ?? "Something went wrong. Please try again.")
      setIsLoginLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setRegError(null)

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setRegError(dict.auth?.errors?.requiredFields ?? "Please fill in all required fields")
      return
    }

    if (regPassword.length < 6) {
      setRegError(dict.auth?.errors?.passwordTooShort ?? "Password must be at least 6 characters")
      return
    }

    setIsRegLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          phone: regPhone.trim() || undefined,
          occupation: regOccupation,
        }),
      })

      const data = (await res.json()) as ApiResponse<UserPublic>

      if (!res.ok || !data.success || !data.data) {
        setRegError(data.error ?? dict.auth?.errors?.generic ?? "Something went wrong. Please try again.")
        setIsRegLoading(false)
        return
      }

      setUser(data.data)

      if (onSuccess) {
        onSuccess(data.data)
      } else {
        router.push(getDestinationUrl())
        router.refresh()
      }
    } catch {
      setRegError(dict.auth?.errors?.generic ?? "Something went wrong. Please try again.")
      setIsRegLoading(false)
    }
  }

  return (
    <div className="w-full space-y-4">
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

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-11 bg-muted p-1 rounded-lg">
          <TabsTrigger value="login" className="h-9 font-medium text-sm">
            {dict.auth?.login ?? "Log in"}
          </TabsTrigger>
          <TabsTrigger value="register" className="h-9 font-medium text-sm">
            {dict.auth?.register ?? "Register"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="pt-2 space-y-4">
          {loginError ? (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircle className="size-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          ) : null}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="tab-login-email"
                className="text-sm font-medium text-foreground flex items-center gap-1.5"
              >
                <Mail className="size-3.5 text-muted-foreground" />
                {dict.auth?.email ?? "Email address"}
              </label>
              <Input
                id="tab-login-email"
                type="email"
                autoComplete="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder={dict.auth?.emailPlaceholder ?? "student@example.com"}
                className="h-11 px-3 text-sm"
                disabled={isLoginLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="tab-login-password"
                className="text-sm font-medium text-foreground flex items-center gap-1.5"
              >
                <Lock className="size-3.5 text-muted-foreground" />
                {dict.auth?.password ?? "Password"}
              </label>
              <Input
                id="tab-login-password"
                type="password"
                autoComplete="current-password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder={dict.auth?.passwordPlaceholder ?? "••••••••"}
                className="h-11 px-3 text-sm"
                disabled={isLoginLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoginLoading}
              className="h-11 w-full text-base font-medium shadow-xs"
            >
              {isLoginLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  {dict.auth?.loggingIn ?? "Signing in..."}
                </>
              ) : (
                (dict.auth?.loginAction ?? "Sign In")
              )}
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-muted-foreground">
            {dict.auth?.noAccount ?? "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => handleTabChange("register")}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {dict.auth?.registerHere ?? "Register here"}
            </button>
          </div>
        </TabsContent>

        <TabsContent value="register" className="pt-2 space-y-4">
          {regError ? (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircle className="size-4 shrink-0" />
              <span>{regError}</span>
            </div>
          ) : null}

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="tab-reg-name"
                className="text-sm font-medium text-foreground flex items-center gap-1.5"
              >
                <User className="size-3.5 text-muted-foreground" />
                {dict.auth?.name ?? "Full Name"}
              </label>
              <Input
                id="tab-reg-name"
                type="text"
                autoComplete="name"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder={dict.auth?.namePlaceholder ?? "e.g. Rahat Ahmed"}
                className="h-11 px-3 text-sm"
                disabled={isRegLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="tab-reg-email"
                className="text-sm font-medium text-foreground flex items-center gap-1.5"
              >
                <Mail className="size-3.5 text-muted-foreground" />
                {dict.auth?.email ?? "Email address"}
              </label>
              <Input
                id="tab-reg-email"
                type="email"
                autoComplete="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder={dict.auth?.emailPlaceholder ?? "student@example.com"}
                className="h-11 px-3 text-sm"
                disabled={isRegLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="tab-reg-password"
                className="text-sm font-medium text-foreground flex items-center gap-1.5"
              >
                <Lock className="size-3.5 text-muted-foreground" />
                {dict.auth?.password ?? "Password"}
              </label>
              <Input
                id="tab-reg-password"
                type="password"
                autoComplete="new-password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder={dict.auth?.passwordPlaceholder ?? "At least 6 characters"}
                className="h-11 px-3 text-sm"
                disabled={isRegLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="tab-reg-phone"
                className="text-sm font-medium text-foreground flex items-center gap-1.5"
              >
                <Phone className="size-3.5 text-muted-foreground" />
                {dict.auth?.phone ?? "Phone number (optional)"}
              </label>
              <Input
                id="tab-reg-phone"
                type="tel"
                autoComplete="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder={dict.auth?.phonePlaceholder ?? "017XXXXXXXX"}
                className="h-11 px-3 text-sm"
                disabled={isRegLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="tab-reg-occupation"
                className="text-sm font-medium text-foreground flex items-center gap-1.5"
              >
                <Briefcase className="size-3.5 text-muted-foreground" />
                {dict.auth?.occupation ?? "Occupation / Role"}
              </label>
              <div className="relative">
                <select
                  id="tab-reg-occupation"
                  value={regOccupation}
                  onChange={(e) => setRegOccupation(e.target.value)}
                  disabled={isRegLoading}
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
              disabled={isRegLoading}
              className="h-11 w-full text-base font-medium shadow-xs"
            >
              {isRegLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  {dict.auth?.registering ?? "Creating account..."}
                </>
              ) : (
                (dict.auth?.registerAction ?? "Create Account")
              )}
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-muted-foreground">
            {dict.auth?.hasAccount ?? "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => handleTabChange("login")}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {dict.auth?.signInHere ?? "Sign in here"}
            </button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

