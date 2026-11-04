"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { AuthTabs } from "@/components/auth/AuthTabs"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import type { Dictionary } from "@/app/[lang]/dictionaries"
import type { UserPublic } from "@/types"

type OpenModalOptions = {
  tab?: "login" | "register"
  from?: string
  onSuccess?: (user: UserPublic) => void
}

type AuthModalContextValue = {
  openModal: (options?: OpenModalOptions) => void
  closeModal: () => void
  isOpen: boolean
}

const AuthModalContext = React.createContext<AuthModalContextValue | null>(null)

export function useAuthModal(): AuthModalContextValue {
  const context = React.useContext(AuthModalContext)
  if (!context) {
    throw new Error("useAuthModal must be used within an AuthModalProvider")
  }
  return context
}

type AuthModalProviderProps = {
  children: React.ReactNode
  lang: string
  dict: Dictionary
}

export function AuthModalProvider({ children, lang, dict }: AuthModalProviderProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<"login" | "register">("login")
  const [fromUrl, setFromUrl] = React.useState<string | undefined>(undefined)
  const successCallbackRef = React.useRef<((user: UserPublic) => void) | undefined>(undefined)

  const isDesktop = useMediaQuery("(min-width: 768px)")

  const openModal = React.useCallback((options?: OpenModalOptions) => {
    setActiveTab(options?.tab ?? "login")
    setFromUrl(options?.from)
    successCallbackRef.current = options?.onSuccess
    setIsOpen(true)
  }, [])

  const closeModal = React.useCallback(() => {
    setIsOpen(false)
    successCallbackRef.current = undefined
  }, [])

  const handleSuccess = React.useCallback((user: UserPublic) => {
    const cb = successCallbackRef.current
    closeModal()
    if (cb) {
      cb(user)
    }
  }, [closeModal])

  const contextValue = React.useMemo(
    () => ({
      openModal,
      closeModal,
      isOpen,
    }),
    [openModal, closeModal, isOpen],
  )

  return (
    <AuthModalContext.Provider value={contextValue}>
      {children}

      {isDesktop ? (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-md p-6">
            <DialogHeader className="text-center pb-2">
              <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-xs mb-1">
                আ
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight">
                {dict.common.appName}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {dict.common.tagline}
              </DialogDescription>
            </DialogHeader>

            <AuthTabs
              lang={lang}
              dict={dict}
              defaultTab={activeTab}
              from={fromUrl}
              onSuccess={handleSuccess}
              isModal={true}
            />
          </DialogContent>
        </Dialog>
      ) : (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto px-4 pt-4 pb-8">
            <SheetHeader className="text-center pb-2">
              <div className="mx-auto flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-xs mb-1">
                আ
              </div>
              <SheetTitle className="text-lg font-bold tracking-tight">
                {dict.common.appName}
              </SheetTitle>
              <SheetDescription className="text-xs">
                {dict.common.tagline}
              </SheetDescription>
            </SheetHeader>

            <AuthTabs
              lang={lang}
              dict={dict}
              defaultTab={activeTab}
              from={fromUrl}
              onSuccess={handleSuccess}
              isModal={true}
            />
          </SheetContent>
        </Sheet>
      )}
    </AuthModalContext.Provider>
  )
}

