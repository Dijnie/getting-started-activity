# Phase 2: Migrate Client Code to Next.js Components

**Status:** Pending | **Priority:** High

## Overview

Convert vanilla JS + HTML into Next.js App Router pages with TypeScript.

## Architecture

```
apps/client/
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Main page (server component shell)
│   │   └── globals.css      # Global styles (from style.css)
│   ├── components/
│   │   └── discord-activity.tsx  # "use client" - Discord SDK logic
│   └── lib/
│       └── discord.ts       # Discord SDK setup helpers
├── public/
│   └── rocket.png           # Static asset
├── next.config.ts
├── tsconfig.json
└── package.json
```

## Implementation Steps

1. **Create `src/app/layout.tsx`** — root layout with metadata, font, globals.css import
2. **Create `src/app/globals.css`** — port from `style.css`
3. **Create `src/lib/discord.ts`** — Discord SDK initialization helper
4. **Create `src/components/discord-activity.tsx`** — `"use client"` component with:
   - `useEffect` for SDK init (browser-only)
   - `useState` for auth state, user info, loading/error states
   - Auth flow: ready → authorize → fetch token → authenticate → display user
5. **Create `src/app/page.tsx`** — server component shell that renders `<DiscordActivity />`
6. **Move `rocket.png`** to `public/`

## Key Patterns

- `"use client"` directive on Discord component
- `useEffect` guard prevents SDK running during SSR
- Error boundaries for graceful failure handling

## Success Criteria

- Discord SDK initializes correctly in iframe context
- Auth flow works: authorize → token exchange → authenticate → display user
- No hydration errors
