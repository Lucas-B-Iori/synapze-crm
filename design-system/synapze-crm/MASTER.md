# Design System Master File — Synapze CRM

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Synapze CRM  
**Category:** Premium B2B SaaS — CRM for Healthcare & Professional Services  
**Mode:** Dark Mode Default  
**Stack:** Next.js + React + TailwindCSS + shadcn/ui

---

## Global Rules

### Color Palette (Dark Mode)

| Role | Hex | Tailwind Equiv. | CSS Variable |
|------|-----|-----------------|--------------|
| Background | `#09090B` | `zinc-950` | `--color-background` |
| Foreground | `#FAFAFA` | `zinc-50` | `--color-foreground` |
| Primary | `#6366F1` | `indigo-500` | `--color-primary` |
| Primary Hover | `#4F46E5` | `indigo-600` | `--color-primary-hover` |
| Secondary | `#27272A` | `zinc-800` | `--color-secondary` |
| Muted | `#A1A1AA` | `zinc-400` | `--color-muted` |
| Border | `#3F3F46` | `zinc-700` | `--color-border` |
| CTA/Accent | `#6366F1` | `indigo-500` | `--color-cta` |
| Success | `#22C55E` | `green-500` | `--color-success` |
| Destructive | `#EF4444` | `red-500` | `--color-destructive` |

**Color Notes:** Ultra-dark foundation with indigo as the primary brand color. High contrast for accessibility. Glassmorphism cards use `bg-zinc-900/50` with `backdrop-blur`.

### Typography

- **Heading Font:** Plus Jakarta Sans
- **Body Font:** Plus Jakarta Sans
- **Mood:** friendly, modern, saas, clean, approachable, professional
- **Google Fonts:** [Plus Jakarta Sans](https://fonts.google.com/share?selection.family=Plus+Jakarta+Sans:wght@300;400;500;600;700)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
```

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `12px` / `0.75rem` | Compact padding |
| `--space-lg` | `16px` / `1rem` | Standard padding |
| `--space-xl` | `24px` / `1.5rem` | Section padding |
| `--space-2xl` | `32px` / `2rem` | Large gaps |
| `--space-3xl` | `48px` / `3rem` | Section margins |

### Shadow Depths (Dark-Optimized)

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | Subtle lift |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.4)` | Cards, buttons |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.5)` | Modals, dropdowns |
| `--shadow-glow` | `0 0 20px rgba(99,102,241,0.15)` | Primary glow accents |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #6366F1;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  transition: all 150ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  background: #4F46E5;
  box-shadow: 0 0 16px rgba(99, 102, 241, 0.25);
}

/* Secondary Button */
.btn-secondary {
  background: rgba(39, 39, 42, 0.6);
  color: #FAFAFA;
  border: 1px solid #3F3F46;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  transition: all 150ms ease;
  cursor: pointer;
}

.btn-secondary:hover {
  background: rgba(63, 63, 70, 0.6);
  border-color: #52525B;
}
```

### Cards (Glassmorphism)

```css
.card {
  background: rgba(24, 24, 27, 0.6);
  border: 1px solid rgba(63, 63, 70, 0.5);
  border-radius: 12px;
  padding: 16px;
  backdrop-filter: blur(12px);
  transition: all 150ms ease;
  cursor: pointer;
}

.card:hover {
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}
```

### Inputs

```css
.input {
  padding: 10px 12px;
  background: #09090B;
  border: 1px solid #3F3F46;
  border-radius: 8px;
  font-size: 14px;
  color: #FAFAFA;
  transition: border-color 150ms ease;
}

.input:focus {
  border-color: #6366F1;
  outline: none;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
}

.input::placeholder {
  color: #71717A;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

.modal {
  background: #09090B;
  border: 1px solid #27272A;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.6);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Liquid Glass + Dark Premium

**Keywords:** Flowing glass, morphing, smooth transitions, fluid effects, translucent, animated blur, iridescent, high contrast

**Best For:** Premium SaaS, high-end B2B dashboards, CRMs, professional services

**Key Effects:**
- Morphing elements (SVG/CSS)
- Fluid animations (150-300ms curves)
- Dynamic blur (`backdrop-filter: blur(12px)`)
- Subtle indigo glow on hover/focus
- No layout-shifting transforms

### Animation Standards

- **Micro-interactions:** 150ms ease-out
- **Modal transitions:** 200ms cubic-bezier(0.16, 1, 0.3, 1)
- **Page transitions:** 300ms ease-in-out
- **Skeleton pulses:** 1.5s infinite

### Layout Principles

- **Dense information architecture** (CRM requires data density)
- **Floating navbar** with `top-0` and subtle bottom border
- **Sidebar** collapsible with hover-expand on desktop
- **Responsive breakpoints:** 375px, 768px, 1024px, 1440px
- **No horizontal scroll** on mobile

---

## Anti-Patterns (Do NOT Use)

- ❌ Cheap visuals
- ❌ Fast/jarring animations (>300ms without purpose)
- ❌ **Emojis as icons** — Use SVG icons (Lucide)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Dark mode text has sufficient contrast (4.5:1 minimum)
- [ ] Glass/transparent elements have visible borders
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
