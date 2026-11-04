import * as React from "react"
import { cn } from "@/lib/utils"

type FeedSkeletonProps = {
  count?: number
  viewMode?: "grid" | "feed"
}

export function FeedSkeleton({ count = 6, viewMode = "grid" }: FeedSkeletonProps) {
  return (
    <div
      className={cn(
        viewMode === "feed"
          ? "flex flex-col max-w-2xl mx-auto space-y-6 w-full"
          : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full",
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col rounded-xl border border-border bg-card p-0 overflow-hidden shadow-xs animate-pulse"
        >
          <div className="flex items-center justify-between p-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-full bg-muted" />
              <div className="space-y-1.5">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-2.5 w-16 rounded bg-muted" />
              </div>
            </div>
            <div className="h-5 w-16 rounded-full bg-muted" />
          </div>

          <div className="aspect-video w-full bg-muted" />

          <div className="flex flex-col p-4 space-y-3">
            <div className="space-y-2">
              <div className="h-4 w-4/5 rounded bg-muted" />
              <div className="h-3.5 w-1/2 rounded bg-muted" />
            </div>

            <div className="flex gap-2">
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-4 w-16 rounded bg-muted" />
            </div>

            <div className="flex gap-1.5 pt-1">
              <div className="h-5 w-14 rounded-full bg-muted" />
              <div className="h-5 w-16 rounded-full bg-muted" />
              <div className="h-5 w-24 rounded-full bg-muted" />
            </div>

            <div className="h-10 w-full rounded-lg bg-muted/50" />

            <div className="pt-2 flex items-center justify-between border-t border-border/50">
              <div className="h-3.5 w-20 rounded bg-muted" />
              <div className="flex gap-2">
                <div className="size-7 rounded bg-muted" />
                <div className="size-7 rounded bg-muted" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

