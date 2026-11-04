"use client"

import * as React from "react"
import {
  RotateCcw,
  MapPin,
  X,
  Building2,
  Users,
  Compass,
  CircleDot,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AccommodationType, GenderPreference, TenantType } from "@/types"
import type { Dictionary } from "@/app/[lang]/dictionaries"

export type SearchFilterState = {
  q: string
  area: string
  minRent: string
  maxRent: string
  type?: AccommodationType
  genderPreference?: GenderPreference
  tenantType?: TenantType
  radius: number
  lat?: number
  lng?: number
}

type FilterControlsProps = {
  filters: SearchFilterState
  onChange: (newFilters: SearchFilterState) => void
  onReset: () => void
  dict: Dictionary
  className?: string
  isMobileSheet?: boolean
  onCloseSheet?: () => void
}

const RADIUS_OPTIONS = [1, 3, 5, 10]

const ACCOMMODATION_TYPES: { labelKey: keyof Dictionary["listing"]["types"]; value: AccommodationType }[] = [
  { labelKey: "SEAT", value: "SEAT" },
  { labelKey: "ROOM", value: "ROOM" },
  { labelKey: "FLAT", value: "FLAT" },
]

const GENDER_OPTIONS: { labelKey: keyof Dictionary["listing"]["genders"]; value: GenderPreference }[] = [
  { labelKey: "ANY", value: "ANY" },
  { labelKey: "MALE", value: "MALE" },
  { labelKey: "FEMALE", value: "FEMALE" },
]

const TENANT_OPTIONS: { labelKey: keyof Dictionary["listing"]["tenants"]; value: TenantType }[] = [
  { labelKey: "ANY", value: "ANY" },
  { labelKey: "BACHELOR", value: "BACHELOR" },
  { labelKey: "FAMILY", value: "FAMILY" },
]

const PRICE_PRESETS = [
  { labelKey: "under5k", min: "", max: "5000" },
  { labelKey: "from5kTo10k", min: "5000", max: "10000" },
  { labelKey: "from10kTo20k", min: "10000", max: "20000" },
  { labelKey: "above20k", min: "20000", max: "" },
]

export function FilterControls({
  filters,
  onChange,
  onReset,
  dict,
  className = "",
  isMobileSheet = false,
  onCloseSheet,
}: FilterControlsProps) {
  const hasActiveFilters = Boolean(
    filters.q ||
      filters.area ||
      filters.minRent ||
      filters.maxRent ||
      filters.type ||
      filters.genderPreference ||
      filters.tenantType ||
      filters.lat !== undefined,
  )

  const handlePricePreset = (min: string, max: string) => {
    if (filters.minRent === min && filters.maxRent === max) {
      onChange({ ...filters, minRent: "", maxRent: "" })
    } else {
      onChange({ ...filters, minRent: min, maxRent: max })
    }
  }

  const handleClearLocation = () => {
    onChange({
      ...filters,
      lat: undefined,
      lng: undefined,
    })
  }

  return (
    <div className={cn("flex flex-col gap-6 text-foreground", className)}>
      {/* Location Pin Status */}
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <MapPin className="size-4 text-primary" />
            <span>{dict?.search?.pinLocation ?? "Search Center"}</span>
          </div>
          {filters.lat !== undefined && filters.lng !== undefined && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={handleClearLocation}
              className="text-xs text-muted-foreground hover:text-destructive h-7"
            >
              <X className="size-3 mr-1" />
              {dict?.search?.clearPin ?? "Clear"}
            </Button>
          )}
        </div>

        {filters.lat !== undefined && filters.lng !== undefined ? (
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-mono">
                {filters.lat.toFixed(4)}, {filters.lng.toFixed(4)}
              </span>
              <span className="font-medium text-primary">{filters.radius} km radius</span>
            </div>

            {/* Radius chips */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-xs text-muted-foreground mr-1">
                {dict?.search?.radius ?? "Radius"}:
              </span>
              {RADIUS_OPTIONS.map((r) => {
                const isSelected = filters.radius === r
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => onChange({ ...filters, radius: r })}
                    className={cn(
                      "min-h-[32px] px-2.5 rounded-md text-xs font-medium transition-colors border",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:bg-muted",
                    )}
                  >
                    {r} km
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {dict?.search?.clickMapToPin ?? "Click anywhere on the map or tap GPS to filter by distance."}
          </p>
        )}
      </div>

      {/* Accommodation Type */}
      <div className="flex flex-col gap-2.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Building2 className="size-3.5" />
          {dict?.search?.accommodationType ?? "Accommodation Type"}
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...filters, type: undefined })}
            className={cn(
              "min-h-[40px] px-3.5 rounded-lg text-xs font-medium transition-colors border",
              !filters.type
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:bg-muted",
            )}
          >
            {dict?.feed?.all ?? "All"}
          </button>
          {ACCOMMODATION_TYPES.map(({ labelKey, value }) => {
            const isSelected = filters.type === value
            return (
              <button
                key={value}
                type="button"
                onClick={() =>
                  onChange({
                    ...filters,
                    type: isSelected ? undefined : value,
                  })
                }
                className={cn(
                  "min-h-[40px] px-3.5 rounded-lg text-xs font-medium transition-colors border",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:bg-muted",
                )}
              >
                {dict?.listing?.types?.[labelKey] ?? value}
              </button>
            )
          })}
        </div>
      </div>

      {/* Monthly Rent Range */}
      <div className="flex flex-col gap-2.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {dict?.search?.rentRange ?? "Monthly Rent (BDT)"}
        </label>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[11px] text-muted-foreground block mb-1">
              {dict?.search?.minRent ?? "Min Rent"}
            </span>
            <Input
              type="number"
              placeholder="0"
              value={filters.minRent}
              onChange={(e) => onChange({ ...filters, minRent: e.target.value })}
              className="h-10 text-sm bg-card"
            />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground block mb-1">
              {dict?.search?.maxRent ?? "Max Rent"}
            </span>
            <Input
              type="number"
              placeholder="50000"
              value={filters.maxRent}
              onChange={(e) => onChange({ ...filters, maxRent: e.target.value })}
              className="h-10 text-sm bg-card"
            />
          </div>
        </div>

        {/* Quick price presets */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          {PRICE_PRESETS.map((preset) => {
            const isSelected =
              filters.minRent === preset.min && filters.maxRent === preset.max
            const label =
              (dict?.search as Record<string, string>)?.[preset.labelKey] ??
              preset.labelKey

            return (
              <button
                key={preset.labelKey}
                type="button"
                onClick={() => handlePricePreset(preset.min, preset.max)}
                className={cn(
                  "min-h-[34px] px-2.5 py-1 rounded-md text-xs font-medium transition-colors border text-center truncate",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground",
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Gender Preference */}
      <div className="flex flex-col gap-2.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Users className="size-3.5" />
          {dict?.search?.genderPreference ?? "Gender Preference"}
        </label>
        <div className="flex flex-wrap gap-2">
          {GENDER_OPTIONS.map(({ labelKey, value }) => {
            const isSelected =
              (filters.genderPreference === undefined && value === "ANY") ||
              filters.genderPreference === value
            return (
              <button
                key={value}
                type="button"
                onClick={() =>
                  onChange({
                    ...filters,
                    genderPreference: value === "ANY" ? undefined : value,
                  })
                }
                className={cn(
                  "min-h-[40px] px-3.5 rounded-lg text-xs font-medium transition-colors border",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:bg-muted",
                )}
              >
                {dict?.listing?.genders?.[labelKey] ?? value}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tenant Type */}
      <div className="flex flex-col gap-2.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <CircleDot className="size-3.5" />
          {dict?.search?.tenantType ?? "Tenant Preference"}
        </label>
        <div className="flex flex-wrap gap-2">
          {TENANT_OPTIONS.map(({ labelKey, value }) => {
            const isSelected =
              (filters.tenantType === undefined && value === "ANY") ||
              filters.tenantType === value
            return (
              <button
                key={value}
                type="button"
                onClick={() =>
                  onChange({
                    ...filters,
                    tenantType: value === "ANY" ? undefined : value,
                  })
                }
                className={cn(
                  "min-h-[40px] px-3.5 rounded-lg text-xs font-medium transition-colors border",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:bg-muted",
                )}
              >
                {dict?.listing?.tenants?.[labelKey] ?? value}
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center gap-3 pt-2 border-t border-border mt-auto">
        {hasActiveFilters && (
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            className="flex-1 min-h-[44px] gap-2 text-xs"
          >
            <RotateCcw className="size-3.5" />
            <span>{dict?.search?.reset ?? "Reset Filters"}</span>
          </Button>
        )}
        {isMobileSheet && onCloseSheet && (
          <Button
            type="button"
            onClick={onCloseSheet}
            className="flex-1 min-h-[44px] text-xs font-medium"
          >
            {dict?.search?.apply ?? "Apply Filters"}
          </Button>
        )}
      </div>
    </div>
  )
}

