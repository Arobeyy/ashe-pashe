import Link from "next/link"
import { Home, Search, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ListingNotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="size-16 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground mb-4">
        <AlertCircle className="size-8" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Accommodation Not Found
      </h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        This listing may have been removed by the host, expired, or the link might be incorrect.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/en">
          <Button variant="outline" className="gap-2">
            <Home className="size-4" />
            Home Feed
          </Button>
        </Link>
        <Link href="/en/search">
          <Button className="gap-2 bg-primary text-primary-foreground">
            <Search className="size-4" />
            Search Other Places
          </Button>
        </Link>
      </div>
    </div>
  )
}

