# Research Report: Turborepo + Yarn Workspaces Setup (2025-2026)

Date: 2026-03-04 | Project: Discord Activity (Vite client + Express server)

---

## 1. Turborepo — Latest Version & Init

Latest stable: **Turborepo 2.x** (2.4+ as of early 2026).

Add to existing repo (no scaffolding):
```bash
yarn add turbo --dev -W   # -W = install in workspace root
```
Or use the global init on an existing root:
```bash
npx create-turbo@latest   # only if starting fresh
```
For migration: just add `turbo` as root devDep + add `turbo.json`.

---

## 2. Root `package.json` — Yarn Workspaces

Yarn Classic (1.x) — simplest for this project:
```json
{
  "name": "getting-started-activity-root",
  "private": true,
  "workspaces": ["apps/*"],
  "devDependencies": {
    "turbo": "^2.0.0"
  },
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint"
  }
}
```

Yarn **workspace protocol** (cross-workspace deps, only needed if packages reference each other):
```json
{ "dependencies": { "shared-utils": "workspace:*" } }
```
Not needed for this project — client and server are independent.

---

## 3. Migration: Moving client/ and server/ into apps/

**Steps:**
```
mkdir apps
mv client apps/client
mv server apps/server
```

Delete per-package lock files (they will be replaced by root `yarn.lock`):
```bash
rm apps/client/package-lock.json apps/server/package-lock.json
```

Run from root to regenerate unified lock file:
```bash
yarn install
```

Keep `apps/client/package.json` name: `"getting-started-activity"` and
`apps/server/package.json` name: `"getting-starter-activity-server"` — no rename needed.

Each app keeps its own `node_modules` only for non-hoistable deps. Shared deps hoist to root.

---

## 4. `turbo.json` — Task Pipeline

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "globalEnv": ["NODE_ENV", "DISCORD_CLIENT_SECRET"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    }
  }
}
```

Key rules:
- `"^build"` = run `build` in all workspace deps first (topological order)
- `"persistent": true` = long-running process (dev servers); prevents turbo from waiting
- `"cache": false` on `dev` = never cache watch mode
- No `dependsOn` on `lint` = runs in parallel across all packages

---

## 5. Environment Variables — Shared `.env` at Root

**Turborepo does NOT load `.env` files** — it only uses them for cache-key hashing.
The framework (Vite) or runtime (dotenv in Express) handles actual loading.

### Vite (`apps/client`)

`vite.config.js` already has `envDir: '../'` — this points one level up from `apps/client/`
to `apps/` (NOT the monorepo root). With `apps/` structure it needs to point two levels up:

```js
// apps/client/vite.config.js
export default defineConfig({
  envDir: '../../',  // monorepo root .env
  // ...
})
```

### Express (`apps/server`)

dotenv already handles root-relative paths. Update path in `server.js`:
```js
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
```

### turbo.json tracking

`globalDependencies: [".env"]` ensures any `.env` change busts all task caches.
Declare secret names in `globalEnv` so Turborepo includes them in hash without leaking values.

---

## 6. Common Gotchas

| Issue | Fix |
|---|---|
| **Phantom deps** — package uses hoisted dep it didn't declare | Ensure each `package.json` explicitly lists all deps |
| **Dual lock files** — old `package-lock.json` per app causes conflicts | Delete all per-app lock files; use single root `yarn.lock` |
| **Wrong `nohoist`** — Yarn Classic nohoist glob patterns are buggy | Avoid unless absolutely necessary (e.g., React Native); use `nmHoistingLimits` in `.yarnrc.yml` for Yarn Berry |
| **`turbo dev` runs all apps** — may conflict on same port | Each app must use different ports; already the case (client :5173, server :3001) |
| **`VITE_*` prefix not in turbo.json** | Turborepo 2.x framework inference auto-includes `VITE_*` — no manual config needed |
| **`turbo` not found** — installed locally not globally | Use `yarn turbo` or add to root scripts and use `yarn dev` |
| **Yarn Classic vs Berry** | Stick with Yarn Classic (1.x) for simplest setup; Berry (4.x) requires `.yarnrc.yml` and PnP may break Vite |

---

## Final Folder Structure

```
getting-started-activity/
├── .env                    # shared env (root)
├── package.json            # workspaces: ["apps/*"]
├── turbo.json
├── yarn.lock               # single unified lock file
└── apps/
    ├── client/             # Vite app (was: client/)
    │   ├── package.json    # name: "getting-started-activity"
    │   └── vite.config.js  # envDir: '../../'
    └── server/             # Express (was: server/)
        ├── package.json    # name: "getting-starter-activity-server"
        └── server.js       # dotenv path: ../../.env
```

---

## Sources

- [Turborepo Configuration Reference](https://turborepo.dev/docs/reference/configuration)
- [Turborepo: Configuring Tasks](https://turborepo.dev/docs/crafting-your-repository/configuring-tasks)
- [Turborepo: Using Environment Variables](https://turborepo.dev/docs/crafting-your-repository/using-environment-variables)
- [Yarn Classic Workspaces Docs](https://classic.yarnpkg.com/lang/en/docs/workspaces/)
- [Premier Octet: Yarn Monorepo Setup](https://www.premieroctet.com/blog/en/yarn-monorepo)
- [Inside the pain of monorepos and hoisting](https://www.jonathancreamer.com/inside-the-pain-of-monorepos-and-hoisting/)

---

## Unresolved Questions

1. Whether to use Yarn Classic (1.x) vs Berry (4.x) — Classic is simpler but Berry is the current maintained version. Berry's PnP (Plug'n'Play) mode can break Vite's node_modules resolution; Berry with `nodeLinker: node-modules` in `.yarnrc.yml` is safe but adds config overhead.
2. `renovate.json` is present — Renovate handles monorepo packages automatically if `packageRules` is configured; no explicit action needed but may need `"extends": ["group:monorepos"]` after migration.
