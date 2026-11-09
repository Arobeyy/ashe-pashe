"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Search,
  Plus,
  PlusCircle,
  LogIn,
  LogOut,
  Bookmark,
  MessageCircle,
  ShieldAlert,
  Globe,
} from "lucide-react"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Dictionary } from "@/app/[lang]/dictionaries"

type AppShellProps = {
  children: React.ReactNode
  lang: string
  dict?: Dictionary
}

// Rewrites current pathname with chosen language prefix
function getSwitchLocalePath(pathname: string, targetLang: string): string {
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length === 0) return `/${targetLang}`
  segments[0] = targetLang
  return `/${segments.join("/")}`
}

export function AppShell({ children, lang, dict }: AppShellProps) {
  const pathname = usePathname()
  const { user, isLoading, logout } = useCurrentUser()

  const isFeedActive = pathname === `/${lang}` || pathname === `/${lang}/`
  const isSearchActive =
    pathname === `/${lang}/search` || pathname.startsWith(`/${lang}/search/`)
  const isPostActive =
    pathname === `/${lang}/post` || pathname.startsWith(`/${lang}/post/`)
  const isProfileActive = pathname.startsWith(`/${lang}/profile`)
  const isSavedActive =
    pathname === `/${lang}/saved` || pathname.startsWith(`/${lang}/saved/`)
  const isMessagesActive =
    pathname === `/${lang}/messages` || pathname.startsWith(`/${lang}/messages/`)
  const isAdminActive =
    pathname === `/${lang}/admin` || pathname.startsWith(`/${lang}/admin/`)
  const isLoginActive =
    pathname === `/${lang}/login` || pathname.startsWith(`/${lang}/login/`)

  const postHref = user
    ? `/${lang}/post`
    : `/${lang}/login?from=${encodeURIComponent(`/${lang}/post`)}`

  const messagesHref = user
    ? `/${lang}/messages`
    : `/${lang}/login?from=${encodeURIComponent(`/${lang}/messages`)}`

  const [unreadCount, setUnreadCount] = React.useState<number>(0)

  React.useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      return
    }

    const fetchUnreadCount = async () => {
      try {
        const res = await fetch("/api/conversations/unread-count")
        if (res.ok) {
          const data = await res.json()
          if (data.success && typeof data.data?.unreadCount === "number") {
            setUnreadCount(data.data.unreadCount)
          }
        }
      } catch {
        // Silently handle background counter errors
      }
    }

    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 15000)
    return () => clearInterval(interval)
  }, [user, pathname])

  const switchLang = lang === "en" ? "bn" : "en"
  const switchLabel = lang === "en" ? "বাংলা" : "English"

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <aside className="fixed top-0 bottom-0 left-0 z-30 hidden md:flex md:w-64 md:flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="flex items-center justify-between px-5 py-4 border-b border-sidebar-border">
          <Link href={`/${lang}`} className="flex items-center gap-3 group">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-base transition-transform group-hover:scale-105">
              আ
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-lg leading-tight tracking-tight text-sidebar-foreground">
                {dict?.common?.appName ?? "Ashepashe"}
              </span>
              <span className="text-xs text-muted-foreground line-clamp-1">
                {dict?.common?.tagline ?? "Student Housing"}
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
          <Link
            href={`/${lang}`}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
              isFeedActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
            )}
          >
            <Home
              className={cn(
                "size-4 shrink-0",
                isFeedActive ? "text-primary" : "text-muted-foreground",
              )}
            />
            <span>{dict?.nav?.feed ?? "Feed"}</span>
          </Link>

          <Link
            href={`/${lang}/search`}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
              isSearchActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
            )}
          >
            <Search
              className={cn(
                "size-4 shrink-0",
                isSearchActive ? "text-primary" : "text-muted-foreground",
              )}
            />
            <span>{dict?.nav?.search ?? "Search"}</span>
          </Link>

          <Link
            href={postHref}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
              isPostActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
            )}
          >
            <PlusCircle
              className={cn(
                "size-4 shrink-0",
                isPostActive ? "text-primary" : "text-muted-foreground",
              )}
            />
            <span>{dict?.nav?.postListing ?? "Post a Listing"}</span>
          </Link>

          {user && (
            <Link
              href={`/${lang}/saved`}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isSavedActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <Bookmark
                className={cn(
                  "size-4 shrink-0",
                  isSavedActive ? "text-primary" : "text-muted-foreground",
                )}
              />
              <span className="flex-1">{dict?.nav?.saved ?? "Saved"}</span>
              {typeof user._count?.savedListings === "number" && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {user._count.savedListings}
                </span>
              )}
            </Link>
          )}

          <Link
            href={messagesHref}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
              isMessagesActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
            )}
          >
            <MessageCircle
              className={cn(
                "size-4 shrink-0",
                isMessagesActive ? "text-primary" : "text-muted-foreground",
              )}
            />
            <span className="flex-1">{dict?.nav?.messages ?? "Messages"}</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </Link>

          {user?.role === "ADMIN" && (
            <Link
              href={`/${lang}/admin`}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isAdminActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <ShieldAlert
                className={cn(
                  "size-4 shrink-0",
                  isAdminActive ? "text-primary" : "text-muted-foreground",
                )}
              />
              <span>{dict?.nav?.admin ?? "Admin"}</span>
            </Link>
          )}
        </nav>

        <div className="p-3 border-t border-sidebar-border space-y-2">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs text-muted-foreground">Language</span>
            <Link
              href={getSwitchLocalePath(pathname, switchLang)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            >
              <Globe className="size-3.5" />
              <span>{switchLabel}</span>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/20 animate-pulse">
              <div className="size-8 rounded-full bg-muted" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-20 rounded bg-muted" />
                <div className="h-2.5 w-14 rounded bg-muted" />
              </div>
            </div>
          ) : user ? (
            <div className="flex items-center justify-between p-2 rounded-lg bg-sidebar-accent/40">
              <Link
                href={`/${lang}/profile/${user.id}`}
                className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80 transition-opacity"
              >
                <Avatar size="sm">
                  {user.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                  ) : null}
                  <AvatarFallback>
                    {user.name.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-sidebar-foreground">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.occupation || user.email}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                title={dict?.nav?.logout ?? "Log out"}
                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                aria-label={dict?.nav?.logout ?? "Log out"}
              >
                <LogOut className="size-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-1.5 pt-1">
              <Link
                href={`/${lang}/login`}
                className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                <LogIn className="size-3.5" />
                <span>{dict?.nav?.login ?? "Log in"}</span>
              </Link>
              <Link
                href={`/${lang}/register`}
                className="flex items-center justify-center w-full py-2 px-3 rounded-lg border border-sidebar-border text-sidebar-foreground text-xs font-medium hover:bg-sidebar-accent transition-colors"
              >
                <span>{dict?.nav?.register ?? "Register"}</span>
              </Link>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col pb-16 md:pb-0 md:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:hidden">
          <Link href={`/${lang}`} className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
              আ
            </div>
            <span className="font-heading font-bold text-base tracking-tight text-foreground">
              {dict?.common?.appName ?? "Ashepashe"}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={getSwitchLocalePath(pathname, switchLang)}
              className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Globe className="size-3.5" />
              <span>{switchLabel}</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 flex flex-col">{children}</main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 h-16 border-t border-border bg-background/95 backdrop-blur flex items-center justify-around px-2 md:hidden">
        <Link
          href={`/${lang}`}
          className={cn(
            "flex-1 flex flex-col items-center justify-center h-full min-h-12 min-w-12 py-1 text-xs transition-colors",
            isFeedActive
              ? "text-primary font-medium"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Home className="size-5" />
          <span className="text-xs mt-1">{dict?.nav?.feed ?? "Feed"}</span>
        </Link>

        <Link
          href={`/${lang}/search`}
          className={cn(
            "flex-1 flex flex-col items-center justify-center h-full min-h-12 min-w-12 py-1 text-xs transition-colors",
            isSearchActive
              ? "text-primary font-medium"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Search className="size-5" />
          <span className="text-xs mt-1">{dict?.nav?.search ?? "Search"}</span>
        </Link>

        <Link
          href={postHref}
          className="flex-1 flex flex-col items-center justify-center h-full min-h-12 min-w-12 py-1 text-xs transition-colors"
          aria-label={dict?.nav?.postListing ?? "Post a Listing"}
        >
          <div
            className={cn(
              "flex size-9 items-center justify-center rounded-full transition-transform active:scale-95",
              isPostActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-foreground hover:bg-accent",
            )}
          >
            <Plus className="size-5" />
          </div>
          <span
            className={cn(
              "text-xs mt-1",
              isPostActive ? "text-primary font-medium" : "text-muted-foreground",
            )}
          >
            {dict?.nav?.post ?? "Post"}
          </span>
        </Link>

        <Link
          href={messagesHref}
          className={cn(
            "flex-1 flex flex-col items-center justify-center h-full min-h-12 min-w-12 py-1 text-xs transition-colors",
            isMessagesActive
              ? "text-primary font-medium"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <div className="relative flex items-center justify-center">
            <MessageCircle className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-2.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary text-xs font-bold leading-none text-primary-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <span className="text-xs mt-1">{dict?.nav?.messages ?? "Messages"}</span>
        </Link>

        {user ? (
          <Link
            href={`/${lang}/profile/${user.id}`}
            className={cn(
              "flex-1 flex flex-col items-center justify-center h-full min-h-12 min-w-12 py-1 text-xs transition-colors",
              isProfileActive
                ? "text-primary font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Avatar size="sm" className="size-5">
              {user.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt={user.name} />
              ) : null}
              <AvatarFallback className="text-xs">
                {user.name.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs mt-1">
              {dict?.nav?.profile ?? "Profile"}
            </span>
          </Link>
        ) : (
          <Link
            href={`/${lang}/login`}
            className={cn(
              "flex-1 flex flex-col items-center justify-center h-full min-h-12 min-w-12 py-1 text-xs transition-colors",
              isLoginActive
                ? "text-primary font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LogIn className="size-5" />
            <span className="text-xs mt-1">
              {dict?.nav?.login ?? "Log in"}
            </span>
          </Link>
        )}
      </nav>
    </div>
  )
}

