# Responsive Layout System — ashepashe

Every UI element in this project must be thoughtfully designed for **both** mobile and desktop. Shipping a component that only works well on one breakpoint is not acceptable.

---

## Breakpoint Split

| Breakpoint | Layout Mode | Navigation |
| :--- | :--- | :--- |
| `< 768px` (mobile) | Stacked, full-width, touch-optimized | **Fixed bottom tab bar** |
| `≥ 768px` (desktop) | Sidebar + content area, pointer-optimized | **Persistent left sidebar** |

---

## Navigation Components

### Mobile — Bottom Tab Bar
- Fixed to the bottom of the viewport (`fixed bottom-0`).
- 4 tabs: **Feed**, **Search**, **Post [+]**, **Profile**.
- Active tab is highlighted using `text-primary` or an underline indicator.
- Tappable area must be at minimum 48×48px per tab.
- Content area has `pb-16` (or equivalent token) to avoid overlap.

### Desktop — Left Sidebar
- Persistent, collapsible sidebar fixed to the left edge.
- Contains: app logo/name, main nav links (Feed, Search, Post, Profile), and user avatar/dropdown at the bottom.
- Sidebar width: use a token or fixed width consistent across all pages (e.g., `w-64`).
- Main content area is offset with `md:ml-64` (or equivalent).

### Single Component Rule
Both modes **must be implemented in a single responsive component** (`src/components/layout/AppShell.tsx` or equivalent). Never create separate `MobileNav.tsx` and `DesktopNav.tsx` components — use Tailwind responsive prefixes (`md:`, `hidden`, `block`) to toggle visibility.

---

## Layout Design Rules

### Mobile (`< 768px`)
- **Full-width layouts** — no horizontal padding waste.
- **Single-column stacking** — cards, forms, and lists fill the full width.
- **Touch targets** — all interactive elements must be ≥ 44px tall.
- **Bottom sheet / drawer** over modals when presenting secondary content (use `Sheet` from shadcn).
- **Avoid hover-only states** — all interactions must work on tap.
- Listing cards: compact, edge-to-edge, image at top.
- Filters: hidden behind a bottom-sheet trigger button.

### Desktop (`≥ 768px`)
- **Sidebar + content split** — sidebar is always visible and stable.
- **Two or three column** layouts where content density allows (e.g., listing feed in a grid).
- **Hover states** are allowed and expected on interactive elements.
- Listing cards: grid layout (`grid-cols-2` or `grid-cols-3`), richer detail visible.
- Filters: visible inline in a collapsible panel or sticky sidebar section.

---

## Tailwind Responsive Patterns

Always use mobile-first Tailwind classes. Desktop overrides use `md:` prefix.

```tsx
// Layout wrapper — mobile stack, desktop sidebar+content
<div className="flex flex-col md:flex-row">
  <Sidebar className="hidden md:flex" />
  <main className="flex-1 pb-16 md:pb-0 md:ml-64">
    {children}
  </main>
  <BottomNav className="fixed bottom-0 left-0 right-0 md:hidden" />
</div>
```

```tsx
// Card grid — single column mobile, grid desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

```tsx
// Filters — bottom sheet on mobile, inline panel on desktop
<FilterSheet className="md:hidden" />
<FilterPanel className="hidden md:block" />
```

---

## Checklist Before Shipping Any UI Component

Before marking a UI task complete, verify:

- [ ] Renders correctly at 375px width (iPhone SE)
- [ ] Renders correctly at 1280px width (standard desktop)
- [ ] Bottom nav does not overlap content on mobile
- [ ] All tap targets are ≥ 44px on mobile
- [ ] Hover states present on desktop interactive elements
- [ ] No layout breaks at the 768px breakpoint crossover
- [ ] Uses design tokens only — no arbitrary Tailwind values

