export default function ListingDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-pulse">
      <div className="h-4 w-28 bg-muted rounded-md" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="h-5 w-20 bg-muted rounded-full" />
              <div className="h-5 w-16 bg-muted rounded-full" />
            </div>
            <div className="h-8 w-3/4 bg-muted rounded-lg" />
            <div className="h-4 w-1/2 bg-muted rounded-md" />
          </div>

          <div className="aspect-video w-full rounded-2xl bg-muted" />

          <div className="space-y-3">
            <div className="h-6 w-32 bg-muted rounded-md" />
            <div className="h-24 w-full bg-muted rounded-xl" />
          </div>

          <div className="h-64 w-full rounded-2xl bg-muted" />
        </div>

        <div className="lg:col-span-1 space-y-5">
          <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
            <div className="h-8 w-1/2 bg-muted rounded-lg" />
            <div className="h-14 w-full bg-muted rounded-xl" />
            <div className="h-10 w-full bg-muted rounded-xl" />
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-muted" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-2/3 bg-muted rounded-md" />
                <div className="h-3 w-1/2 bg-muted rounded-md" />
              </div>
            </div>
            <div className="h-10 w-full bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

