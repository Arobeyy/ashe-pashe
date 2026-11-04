# Design System — ashepashe

**Stack**: Tailwind CSS v4 + shadcn/ui (base-nova style) + Radix UI primitives + lucide-react icons.

The entire visual language is controlled through CSS custom properties defined in [`src/app/globals.css`](../../src/app/globals.css). Changing a token there cascades the full UI.

---

## Token Architecture

Tokens are defined as CSS variables in `:root` (light) and `.dark` (dark mode), using **OKLCH color space** for perceptual uniformity. They are mapped into Tailwind's theme via the `@theme inline` block.

### Color Tokens

| Token | Tailwind class | Purpose |
| :--- | :--- | :--- |
| `--background` | `bg-background` | Page background |
| `--foreground` | `text-foreground` | Default text |
| `--card` / `--card-foreground` | `bg-card`, `text-card-foreground` | Card surfaces |
| `--popover` / `--popover-foreground` | `bg-popover`, `text-popover-foreground` | Dropdowns, tooltips |
| `--primary` / `--primary-foreground` | `bg-primary`, `text-primary-foreground` | Primary actions |
| `--secondary` / `--secondary-foreground` | `bg-secondary`, `text-secondary-foreground` | Secondary surfaces |
| `--muted` / `--muted-foreground` | `bg-muted`, `text-muted-foreground` | Subtle text, disabled states |
| `--accent` / `--accent-foreground` | `bg-accent`, `text-accent-foreground` | Hover highlights |
| `--destructive` | `bg-destructive`, `text-destructive` | Danger/delete actions |
| `--border` | `border-border` | All borders |
| `--input` | `border-input` | Input field borders |
| `--ring` | `ring-ring` | Focus rings |

### Radius Tokens

| Token | Tailwind class | Value |
| :--- | :--- | :--- |
| `--radius-sm` | `rounded-sm` | `--radius × 0.6` |
| `--radius-md` | `rounded-md` | `--radius × 0.8` |
| `--radius-lg` | `rounded-lg` | `--radius` (base) |
| `--radius-xl` | `rounded-xl` | `--radius × 1.4` |
| `--radius-2xl` | `rounded-2xl` | `--radius × 1.8` |
| `--radius-3xl` | `rounded-3xl` | `--radius × 2.2` |
| `--radius-4xl` | `rounded-4xl` | `--radius × 2.6` |

The base `--radius` is `0.625rem`. All other radii derive from it — change one variable to retheme all corners.

### Typography Tokens

| Token | Tailwind class | Purpose |
| :--- | :--- | :--- |
| `--font-sans` | `font-sans` | Body text (Geist) |
| `--font-mono` | `font-mono` | Code, monospace (Geist Mono) |
| `--font-heading` | `font-heading` | Headings (aliased to sans) |

---

## ⚠️ Mandatory Design Token Rules

> **FORBIDDEN**: Using arbitrary Tailwind values (e.g., `bg-[#ff0000]`, `text-[14px]`, `p-[22px]`, `rounded-[8px]`) anywhere in the codebase.

All styling **must** reference the defined token classes. If a design requires a value not covered by an existing token, **add the token to `globals.css` first**, then use the Tailwind class.

**Valid** ✅
```tsx
<div className="bg-primary text-primary-foreground rounded-lg border-border p-4">
```

**Invalid** ❌
```tsx
<div className="bg-[#1a1a2e] text-[#eee] rounded-[12px] border-[#333] p-[18px]">
```

---

## Component Library

All primitive UI components live in `src/components/ui/` and are installed via `shadcn` CLI. Never edit the raw shadcn primitives directly unless creating a project-specific variant. Extend by wrapping, not modifying.

**Installed components**: `accordion`, `avatar`, `badge`, `button`, `card`, `carousel`, `dialog`, `input`, `sheet`, `tabs`, `textarea`.

---

## Navigation Patterns

| Breakpoint | Pattern |
| :--- | :--- |
| Mobile (`< 768px`) | Fixed bottom 4-tab bar: **Feed**, **Search**, **Post [+]**, **Profile** |
| Desktop (`≥ 768px`) | Top header nav bar with user dropdown and post button |

