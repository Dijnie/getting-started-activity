# Phase 1: Scaffold Next.js App & Configure Monorepo

**Status:** Pending | **Priority:** High

## Overview

Remove old Vite client, scaffold Next.js app in `apps/client`, update Turbo config.

## Related Files

- `apps/client/package.json` — replace deps
- `apps/client/vite.config.js` — delete
- `apps/client/index.html` — delete (Next.js has own)
- `turbo.json` — may need update
- `apps/client/turbo.json` — create (per-app override)
- `.yarnrc.yml` — verify nodeLinker

## Implementation Steps

1. **Delete old client files**: Remove `vite.config.js`, `index.html`, `main.js`, `style.css`, `dist/`, `.turbo/`
2. **Create Next.js package.json** with `next`, `react`, `react-dom`, `@discord/embedded-app-sdk`, TypeScript deps
3. **Create `tsconfig.json`** for Next.js
4. **Create `next.config.ts`** with rewrites proxy to Express (port 8080) and env loading from root `.env`
5. **Create `apps/client/turbo.json`** with `.next/**` outputs (exclude cache)
6. **Verify `.yarnrc.yml`** has `nodeLinker: node-modules`
7. **Run `yarn install`** to install new deps

## Success Criteria

- `yarn dev` starts both Next.js and Express without errors
- Next.js app accessible on its dev port
