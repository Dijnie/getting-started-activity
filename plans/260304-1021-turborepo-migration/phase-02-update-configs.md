# Phase 02 — Update Configs

After moving to `apps/`, path references must be updated to account for the extra directory level.

---

## 1. `apps/client/vite.config.js` — fix `envDir`

The `.env` file lives at repo root. From `apps/client/`, that is two levels up.

**Before:**
```js
envDir: '../',
```

**After:**
```js
envDir: '../../',
```

Full file (no other changes):
```js
import {defineConfig} from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  envDir: '../../',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
    hmr: {
      clientPort: 443,
    },
  },
});
```

---

## 2. `apps/server/server.js` — fix dotenv path

`server.js` uses `"type": "module"`, so `__dirname` is unavailable. Use `import.meta.url` instead.

**Before:**
```js
dotenv.config({ path: "../.env" });
```

**After:**
```js
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });
```

Full file:
```js
import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });

const app = express();
const port = 3001;

app.use(express.json());

app.post("/api/token", async (req, res) => {
  const response = await fetch(`https://discord.com/api/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.VITE_DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code: req.body.code,
    }),
  });

  const { access_token } = await response.json();
  res.send({ access_token });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
```

---

## 3. `.gitignore` — add Turbo cache dir

Append to existing `.gitignore`:
```
# Turbo cache
.turbo
```

No other changes needed — `node_modules` and `dist` are already covered.

---

## 4. `renovate.json` — no changes needed

Renovate's `ignorePaths: ["**/node_modules/**"]` already covers the monorepo layout. Workspace packages under `apps/` will be picked up automatically by Renovate's monorepo detection via `workspaces` in root `package.json`.

---

## Verification Checklist

```bash
# From repo root:
yarn install                    # clean install, no errors
turbo run dev                   # both client (port 5173) and server (port 3001) start
curl -s http://localhost:3001   # server responds (404 or similar — not ECONNREFUSED)
```

Copy `example.env` to `.env`, fill in credentials, then test the full OAuth flow in Discord.
