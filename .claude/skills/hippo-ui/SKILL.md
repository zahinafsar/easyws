---
name: hippo-ui
description: Use this skill when building UI in a project that uses hippo-ui (HippoUI). Installs, updates, and composes copy-paste React components from hippo-ui. Trigger when the user asks to add a button/dialog/table/etc., scaffold a form, theme the app, or says "use hippo-ui". Respects the rule that components live in components/ui and are owned by the repo — never wrap them in an npm package.
---

# HippoUI skill

HippoUI is a copy-paste React component library. Components are Tailwind + framer-motion, read CSS variables for theming, and live inside the consumer repo under `components/ui/`. There is no runtime package — you edit the source directly.

## When to use

- User asks to add, update, or remove a UI component (button, dialog, table, sidebar, etc.).
- User asks to theme the app or change color tokens.
- User is starting a new page/feature that needs form, modal, nav, or data display primitives.

## CLI

All component + theme management goes through the `myhippo` CLI (invoked via `npx`, no install).

```bash
npx myhippo clone                  # install every component + lib helpers
npx myhippo add <name...>          # install specific components
npx myhippo update <name...>       # redownload (overwrite) components
npx myhippo remove <name...>       # delete components
npx myhippo theme <name>           # install a theme preset into styles/hippo-theme.css
npx myhippo skill                  # install this skill into .claude/skills/hippo-ui/
```

Valid component slugs:
`accordion, alert, avatar, badge, breadcrumb, button, calendar, card, checkbox, combobox, command-palette, confirm-modal, data-table, date-picker, dialog, dropdown-menu, empty-state, input, label, pagination, popover, portal, progress, radio, select, separator, sheet, sidebar, skeleton, spinner, switch, table, tabs, textarea, toast, tooltip`.

Valid theme slugs: `zinc` (default), `slate`, `rose`, `emerald`, `amber`.

## Install checklist

Before authoring UI, verify the consumer project has:

1. React 19 or 18, Tailwind CSS v4.
2. Peer deps: `motion`, `lucide-react`. Install with `npm i motion lucide-react` if missing.
3. `lib/cn.ts` (the CLI drops this in automatically).
4. Theme tokens defined in the global stylesheet. If missing, run `npx myhippo theme zinc` and import `styles/hippo-theme.css` from the app's root CSS.

## Rules for writing code against hippo-ui

- Import components from `@/components/ui/<name>`, never from an npm package.
- If a component is not already in `components/ui/`, run `npx myhippo add <name>` before importing it — do not fabricate missing primitives.
- Treat the files in `components/ui/` as owned by the repo: you may edit them freely, but note that `npx myhippo update` will overwrite them.
- Compose with the `cn` helper from `@/lib/cn` for conditional classes. Do not introduce `clsx`/`tailwind-merge` directly.
- Respect CSS variables (`bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`, `bg-primary`, etc.). Do not hardcode hex colors.
- Dark mode is class-based (`.dark` on `<html>`). Components already handle it — do not add per-component dark: variants unless the design calls for them.
- Animations use `motion/react`. Follow the patterns in the component source rather than introducing a new animation library.
- Forms: pair `input`, `label`, `select`, `checkbox`, `radio`, `switch`, `textarea`, `button`. Use `dialog` or `sheet` for modal flows, `toast` for async feedback.

## Theming

Themes are pure CSS variable sets. A theme file defines `:root` + `.dark` blocks for all tokens. To change theme at runtime, swap which theme file is imported; to let the user toggle light/dark, toggle the `dark` class on `<html>` (already wired by `components/docs/theme-provider.tsx` in the monorepo — mimic that pattern in the consumer app if needed).

Custom themes: copy any preset from `themes/<name>.css`, rename, edit the variables. Keep the same variable names so components continue to resolve.

## Troubleshooting

- "Unknown component" from CLI: the slug is not in the registry. Check spelling against the list above.
- Components render unstyled: Tailwind v4 is not set up, or theme variables are missing. Install a theme and ensure `@import "tailwindcss"` is at the top of the global stylesheet.
- Hydration warnings on theme toggle: the `dark` class must be applied before React hydrates. Use a blocking inline script in `<head>` (see `components/docs/theme-provider.tsx`).
