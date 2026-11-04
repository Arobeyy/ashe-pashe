"use client"

import * as React from "react"
import { useActionGate } from "@/hooks/useActionGate"

type ActionGateProps = {
  children: React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>
  returnUrl?: string
  onUnauthenticated?: () => void
}

export function ActionGate({
  children,
  returnUrl,
  onUnauthenticated,
}: ActionGateProps) {
  const { isAuthenticated, requireAuth } = useActionGate()

  const handleClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault()
      e.stopPropagation()
      if (onUnauthenticated) {
        onUnauthenticated()
      }
      requireAuth(() => {}, { returnUrl })
      return
    }

    if (children.props.onClick) {
      children.props.onClick(e)
    }
  }

  return React.cloneElement(children, {
    onClick: handleClick,
  })
}

