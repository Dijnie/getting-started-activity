# Research Report: Discord Activity (Embedded App) with Next.js App Router + TypeScript

Date: 2026-03-04 | Sources: Discord docs, GitHub kneesdev/discord-activity-nextjs, deepwiki, Next.js docs

---

## 1. Next.js App Router Inside Discord Activity iframes

**Yes, works well.** Discord Activities are iframes pointing to `https://<app_id>.discordsays.com`, which proxies to your hosted app. No iframe-specific restrictions block Next.js App Router.

Key constraint: all network requests must route through `https://<app_id>.discordsays.com` (enforced via CSP). You cannot make direct external API calls from the client — must use configured URL mappings.

---

## 2. `output: 'export'` (Static) vs. Running Next.js Server

**Use the Next.js server (no `output: 'export'`).** Reasons:

| | Static Export | Next.js Server |
|---|---|---|
| `/api/token` route | Not supported — needs server | Built-in Route Handler |
| Consolidation | Keeps Express server separate | Can eliminate Express entirely |
| SSR/RSC | None | Available if needed |

With App Router, the `/api/token` endpoint becomes a Next.js Route Handler — Express server becomes optional. This is the recommended approach per community boilerplate.

---

## 3. Discord SDK Initialization in Next.js App Router

SDK is browser-only. Two patterns work:

**Pattern A — `"use client"` + `useEffect` (preferred):**
```tsx
// lib/discord.ts — singleton to prevent re-init
import { DiscordSDK } from "@discord/embedded-app-sdk";
let sdk: DiscordSDK | null = null;
export function getDiscordSDK() {
  if (!sdk) sdk = new DiscordSDK(process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!);
  return sdk;
}

// hooks/useDiscord.ts
"use client";
import { useEffect, useState } from "react";
import { getDiscordSDK } from "@/lib/discord";

export function useDiscord() {
  const [auth, setAuth] = useState(null);
  useEffect(() => {
    async function init() {
      const sdk = getDiscordSDK();
      await sdk.ready();
      const { code } = await sdk.commands.authorize({
        client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!,
        response_type: "code",
        state: "",
        prompt: "none",
        scope: ["identify", "guilds"],
      });
      const res = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirect_uri: `https://${location.host}` }),
      });
      const { access_token } = await res.json();
      const authResult = await sdk.commands.authenticate({ access_token });
      setAuth(authResult);
    }
    init().catch(console.error);
  }, []);
  return auth;
}
```

**Pattern B — `next/dynamic` with `ssr: false`** (use only if hydration errors occur):
```tsx
const DiscordApp = dynamic(() => import("@/components/DiscordApp"), { ssr: false });
```

Pattern A is cleaner. The `"use client"` directive does NOT prevent SSR by itself — the `useEffect` ensures SDK init only runs client-side. If you see hydration errors, fall back to Pattern B.

---

## 4. Next.js Proxy Config (replaces Vite proxy)

**Current Vite proxy** (`vite.config.js`):
```js
proxy: { '/api': { target: 'https://8080.dijnie.dev', changeOrigin: true } }
```

**Next.js equivalent** — two options:

**Option A: Next.js Route Handler (eliminates Express)**
```
app/api/token/route.ts  — handles POST /api/token directly
```
```ts
// app/api/token/route.ts
export async function POST(req: Request) {
  const { code, redirect_uri } = await req.json();
  const res = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: "authorization_code",
      code,
      redirect_uri,
    }),
  });
  const { access_token } = await res.json();
  return Response.json({ access_token });
}
```

**Option B: Rewrites to existing Express server (keep Express)**
```ts
// next.config.ts
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*",
      },
    ];
  },
};
export default nextConfig;
```

Option A is recommended — removes the Express dependency entirely.

---

## 5. Known Issues / Gotchas

- **Client-side error on localhost**: Visiting `http://localhost:3000` directly shows a Discord SDK error — normal, SDK only works inside Discord iframe. Ignore during non-Discord dev.
- **`"use client"` doesn't disable SSR**: Components still render server-side. Must use `useEffect` or `ssr: false` to guard browser-only SDK code.
- **CSP blocks external requests**: Client cannot call `https://discord.com/api/oauth2/token` directly — must go through your server (`/api/token`). Already correct in the existing pattern.
- **URL Mappings in Dev Portal**: During dev, set URL mapping root (`/`) to your cloudflared tunnel URL. For production, point to your deployed Next.js domain.
- **`patchUrlMappings()` for third-party libs**: If using libs that call external URLs (e.g., Colyseus, Supabase), call `sdk.patchUrlMappings([...])` to rewrite those URLs through Discord's proxy.
- **No `output: 'export'`**: Static export breaks API Route Handlers. Don't use it.

---

## 6. Environment Variables

| Vite (current) | Next.js |
|---|---|
| `VITE_DISCORD_CLIENT_ID` | `NEXT_PUBLIC_DISCORD_CLIENT_ID` |
| `DISCORD_CLIENT_SECRET` | `DISCORD_CLIENT_SECRET` (server-only, no prefix) |

`NEXT_PUBLIC_*` prefix exposes var to browser bundle. Secret stays server-only (no prefix).

```env
# .env
NEXT_PUBLIC_DISCORD_CLIENT_ID=123456789
DISCORD_CLIENT_ID=123456789
DISCORD_CLIENT_SECRET=abc...xyz
```

Note: current `server.js` uses `VITE_DISCORD_CLIENT_ID` for the server-side token exchange — rename to `DISCORD_CLIENT_ID` in Next.js Route Handler.

---

## Migration Summary (Vite → Next.js)

1. Create Next.js app in `apps/client/` (replace Vite setup)
2. Move `server.js` token exchange logic to `app/api/token/route.ts`
3. Move SDK init logic to `hooks/useDiscord.ts` with `"use client"`
4. Rename env vars (`VITE_*` → `NEXT_PUBLIC_*`)
5. Delete Express server (`apps/server/`) — no longer needed
6. No `next.config.ts` proxy needed if using Route Handler

---

## Unresolved Questions

- Does the current cloudflared tunnel URL (`8080.dijnie.dev`) need updating in Discord Dev Portal URL Mappings after migration (Next.js typically runs on port 3000)?
- If keeping Turbo monorepo structure: does `turbo.json` need updates for Next.js dev/build pipeline?
- Is WebSocket support (`ws: true` in current Vite proxy) needed? Next.js rewrites support WS passthrough but Route Handlers do not.
