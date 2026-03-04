# Research Report: Next.js in Turborepo Monorepo with Yarn 4

Date: 2026-03-04

## Executive Summary

Adding Next.js to `apps/client` in the existing monorepo requires: updating `turbo.json` outputs, adding a `package.json` for the Next.js app, creating `next.config.js`, and one `.yarnrc.yml` setting for Yarn 4 compatibility. No breaking changes to the Express server in `apps/server`. Turborepo auto-detects Next.js and handles `NEXT_PUBLIC_*` env vars without explicit declaration.

---

## 1. turbo.json Changes

Current `build` outputs: `["dist/**"]` — works for Express but wrong for Next.js.

**Option A (per-app turbo.json — RECOMMENDED):**

Keep root `turbo.json` generic; add `apps/client/turbo.json` to override for Next.js only:

```json
// apps/client/turbo.json
{
  "extends": ["//"],
  "tasks": {
    "build": {
      "outputs": [".next/**", "!.next/cache/**"]
    }
  }
}
```

Root `turbo.json` stays as-is (`dist/**` for Express). The `!.next/cache/**` exclusion is critical — cache dir is huge and should not be tracked by Turbo.

**Option B (root turbo.json — simpler but blunt):**

```json
{
  "tasks": {
    "build": {
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    }
  }
}
```

Gotcha: `dist/**` glob on a Next.js app is harmless but adds noise.

---

## 2. Environment Variables

Turborepo uses **framework inference** — auto-detects Next.js apps and includes `NEXT_PUBLIC_*` prefix wildcard in cache key automatically. No explicit `env` config needed for `NEXT_PUBLIC_*` vars.

**Root .env → Next.js app:**

Turborepo does NOT load `.env` files into task runtime. Next.js loads its own `.env.local`/`.env` via built-in support. Two approaches:

**Approach A (recommended for monorepo):** Symlink or copy env at build time — avoid this complexity.

**Approach B (simplest):** Add `apps/client/.env.local` with the Next.js-specific vars. For dev, duplicate `NEXT_PUBLIC_DISCORD_CLIENT_ID` there.

**Approach C (track root .env in turbo inputs):**

```json
// apps/client/turbo.json
{
  "tasks": {
    "build": {
      "inputs": ["$TURBO_DEFAULT$", "../../.env", ".env*"],
      "outputs": [".next/**", "!.next/cache/**"]
    }
  }
}
```

This makes Turbo re-run build when root `.env` changes, but Next.js still won't read it at runtime unless you explicitly load it in `next.config.js`:

```js
// apps/client/next.config.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {};
module.exports = nextConfig;
```

**Variable rename:** `VITE_DISCORD_CLIENT_ID` → `NEXT_PUBLIC_DISCORD_CLIENT_ID`. Next.js only exposes `NEXT_PUBLIC_*` to the browser (same pattern as Vite's `VITE_`).

---

## 3. apps/client Next.js Setup

```
apps/client/
├── package.json
├── next.config.js
├── tsconfig.json         (optional)
├── .env.local            (gitignored, Next.js-native)
├── app/                  (App Router) or pages/
│   └── page.tsx
└── public/
```

```json
// apps/client/package.json
{
  "name": "client",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

Port: Next.js defaults to 3000, Express is likely already on 3000 — set Next.js to a different port:

```json
"dev": "next dev --port 3001"
```

---

## 4. Yarn 4 Considerations

**Critical:** Yarn 4 defaults to `node-modules` linker (changed from v1 default), but verify with:

```yaml
# root .yarnrc.yml — explicit is safer
nodeLinker: node-modules
```

Next.js has **known PnP compatibility issues** (webpack plugin conflicts, turbopack incompatibility). Always use `node-modules` linker. Do NOT use `pnp` linker with Next.js.

**Yarn 4 workspace protocol:** Unlike pnpm, Yarn uses `"*"` not `"workspace:*"` for internal packages in `package.json` deps. Next.js app referencing shared packages:

```json
"@repo/ui": "*"
```

**Install after adding apps/client:**

```bash
yarn install
```

Yarn will hoist Next.js deps to root `node_modules` per workspace behavior.

---

## 5. Coexistence with apps/server (Express)

No conflicts. Each app runs independently via Turbo's task orchestration. Root `turbo.json` `dev` task (persistent) runs both concurrently:

```
turbo run dev
  → apps/server: node/ts-node/nodemon  (port 3000)
  → apps/client: next dev --port 3001  (port 3001)
```

No shared config needed unless you add a `packages/` directory for shared code.

---

## Minimal Implementation Checklist

1. Add `apps/client/package.json` with next deps
2. Add `apps/client/next.config.js` (optionally load root `.env`)
3. Add `apps/client/turbo.json` with `.next/**` outputs
4. Verify/add `nodeLinker: node-modules` to root `.yarnrc.yml`
5. Run `yarn install` from root
6. Change `VITE_DISCORD_CLIENT_ID` → `NEXT_PUBLIC_DISCORD_CLIENT_ID` in env files
7. Add `apps/client/app/page.tsx` (or `pages/index.tsx`)

---

## Unresolved Questions

- Does `apps/server` currently define its own `turbo.json`? If not, root `build: outputs: ["dist/**"]` applies to both — harmless for Next.js but confirm Express actually outputs to `dist/`.
- Is Discord SDK being used in the client (browser)? If so, confirm Next.js App Router vs Pages Router compatibility with the SDK.
- Does root `.env` need to be read at Next.js build time or only runtime? Affects whether dotenv loading in `next.config.js` is needed.

---

## Sources

- [Turborepo Next.js Guide](https://turborepo.dev/docs/guides/frameworks/nextjs)
- [Turborepo env vars docs](https://turborepo.dev/docs/crafting-your-repository/using-environment-variables)
- [Turborepo turbo.json reference](https://turborepo.dev/docs/reference/configuration)
- [Yarn Berry PnP vs node-modules](https://yarnpkg.com/features/linkers)
- [Next.js + Yarn PnP integration](https://www.restack.io/docs/nextjs-knowledge-nextjs-yarn-pnp-integration)
- [Turborepo NEXT_PUBLIC issue](https://github.com/vercel/turborepo/issues/1058)
