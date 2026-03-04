# Migrate Client to Next.js

**Date:** 2026-03-04 | **Priority:** High | **Status:** Planning

## Summary

Replace `apps/client` (Vite + Vanilla JS) with Next.js App Router + TypeScript. Keep Express server and monorepo structure.

## Phases

| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | Scaffold Next.js app & configure monorepo | Pending | [phase-01](phase-01-scaffold-nextjs.md) |
| 2 | Migrate client code to Next.js components | Pending | [phase-02](phase-02-migrate-client.md) |
| 3 | Update env vars, proxy config & cleanup | Pending | [phase-03](phase-03-config-cleanup.md) |

## Key Decisions

- **Keep monorepo**: Next.js replaces Vite client, Express server unchanged
- **App Router + TypeScript**: Modern Next.js patterns with type safety
- **`"use client"` + `useEffect`**: Discord SDK is browser-only
- **`rewrites` in next.config.ts**: Proxy `/api/*` to Express server
- **Env rename**: `VITE_DISCORD_CLIENT_ID` → `NEXT_PUBLIC_DISCORD_CLIENT_ID`
