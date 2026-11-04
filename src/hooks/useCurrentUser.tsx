"use client"

import * as React from "react"
import type { ApiResponse, UserPublic } from "@/types"

type AuthContextValue = {
  user: UserPublic | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  logout: () => Promise<void>
  setUser: (user: UserPublic | null) => void
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<UserPublic | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const refetch = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/me")
      if (!res.ok) {
        setUser(null)
        return
      }
      const json = (await res.json()) as ApiResponse<UserPublic | null>
      if (json.success && json.data) {
        setUser(json.data)
      } else {
        setUser(null)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch user"
      setError(message)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = React.useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
    } catch {
      setUser(null)
    }
  }, [])

  React.useEffect(() => {
    let ignore = false
    async function load() {
      try {
        const res = await fetch("/api/auth/me")
        if (ignore) return
        if (!res.ok) {
          setUser(null)
          return
        }
        const json = (await res.json()) as ApiResponse<UserPublic | null>
        if (ignore) return
        if (json.success && json.data) {
          setUser(json.data)
        } else {
          setUser(null)
        }
      } catch (err) {
        if (ignore) return
        const message = err instanceof Error ? err.message : "Failed to fetch user"
        setError(message)
        setUser(null)
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }
    void load()
    return () => {
      ignore = true
    }
  }, [])

  const value = React.useMemo(
    () => ({
      user,
      isLoading,
      error,
      refetch,
      logout,
      setUser,
    }),
    [user, isLoading, error, refetch, logout, setUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useCurrentUser(): AuthContextValue {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useCurrentUser must be used within an AuthProvider")
  }
  return context
}
