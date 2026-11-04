"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { useAuthModal } from "@/components/auth/AuthModal"

type RequireAuthOptions = {
  returnUrl?: string
  mode?: "modal" | "redirect"
  tab?: "login" | "register"
}

export function useActionGate() {
  const { user, isLoading } = useCurrentUser()
  const router = useRouter()
  const pathname = usePathname()
  const { openModal, closeModal, isOpen } = useAuthModal()

  // Derives current language prefix from url path
  const lang = React.useMemo(() => {
    const segments = pathname.split("/").filter(Boolean)
    return segments[0] || "en"
  }, [pathname])

  const getGateUrl = React.useCallback(
    (customReturnUrl?: string) => {
      const returnUrl = customReturnUrl || pathname
      return `/${lang}/login?from=${encodeURIComponent(returnUrl)}`
    },
    [lang, pathname],
  )

  const requireAuth = React.useCallback(
    (action: () => void | Promise<void>, options?: RequireAuthOptions) => {
      if (!user) {
        if (options?.mode === "redirect") {
          router.push(getGateUrl(options?.returnUrl))
          return
        }
        openModal({
          tab: options?.tab ?? "login",
          from: options?.returnUrl ?? pathname,
          onSuccess: () => {
            void action()
          },
        })
        return
      }
      return action()
    },
    [user, router, pathname, getGateUrl, openModal],
  )

  return {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    lang,
    getGateUrl,
    requireAuth,
    openAuthModal: openModal,
    closeAuthModal: closeModal,
    isAuthModalOpen: isOpen,
  }
}
