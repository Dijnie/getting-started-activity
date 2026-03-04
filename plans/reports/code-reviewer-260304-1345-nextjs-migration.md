# Code Review: Next.js Migration (Discord Activity)

**Date:** 2026-03-04
**Branch:** main
**Build:** PASS (Next.js 15.5.12, TypeScript clean)

---

## Scope

- Files reviewed: 12
- `apps/client/package.json`, `tsconfig.json`, `next.config.ts`, `turbo.json`
- `apps/client/src/app/{layout.tsx,page.tsx,globals.css}`
- `apps/client/src/components/discord-activity.tsx`
- `apps/client/src/lib/discord.ts`
- `apps/server/server.js`
- `.gitignore`, `example.env` (privacy-blocked, skipped)
- Review focus: recent migration changes

---

## Overall Assessment

Build and type-check pass cleanly. Architecture is sound: correct "use client" boundary, singleton SDK pattern, discriminated-union state machine for UI phases. Three issues worth fixing before production.

---

## Critical Issues

None.

---

## High Priority Findings

### 1. `next.config.ts` uses `__dirname` — breaks in ESM

**File:** `apps/client/next.config.ts:6`

```ts
dotenv.config({ path: resolve(__dirname, "../../.env") });
```

`next.config.ts` is compiled by Next.js with `moduleResolution: bundler` and can run in an ESM context where `__dirname` is undefined. However the build currently passes because Next.js transpiles config files with CJS-compatible shims. This is fragile — if Next.js config processing changes, it silently fails to load `.env` (no error thrown; dotenv silently ignores missing `path`).

**Fix:** use `import { fileURLToPath } from "url"` consistently (same pattern already used in `server.js`), or prefer `process.cwd()`:

```ts
import { fileURLToPath } from "url";
const __dirname = fileURLToPath(new URL(".", import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../.env") });
```

Or, since Next.js 15 natively reads `.env` files from the project root, **simply remove the manual dotenv call** from `next.config.ts` entirely if the `.env` is at workspace root — use `env` or `NEXT_PUBLIC_*` exposure in `next.config.ts` instead.

### 2. Token endpoint: no error handling — silently forwards bad tokens

**File:** `apps/server/server.js:17-38`

```js
app.post("/api/token", async (req, res) => {
  const response = await fetch(...);
  const { access_token } = await response.json();
  res.send({ access_token });  // no check on response.ok
});
```

If Discord returns an error (invalid code, rate limit, secret mismatch), `access_token` is `undefined`. The client then calls `discordSdk.commands.authenticate({ access_token: undefined })`, which fails with an opaque error. No `try/catch` means an unhandled promise rejection can crash the process (Node.js 15+).

**Fix:**

```js
app.post("/api/token", async (req, res) => {
  try {
    const response = await fetch(...);
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }
    res.send({ access_token: data.access_token });
  } catch (err) {
    res.status(500).json({ error: "Token exchange failed" });
  }
});
```

---

## Medium Priority Improvements

### 3. Client does not check HTTP status on `/api/token` response

**File:** `apps/client/src/components/discord-activity.tsx:53-61`

```ts
const response = await fetch("/api/token", { ... });
const data = await response.json();
// data.access_token might be undefined if server returned error
```

Should guard:

```ts
if (!response.ok) {
  throw new Error(`Token exchange failed: ${response.status}`);
}
```

### 4. `dotenv` listed as a runtime dependency in client `package.json`

**File:** `apps/client/package.json:13`

`dotenv` is only used in `next.config.ts` (build-time). It should be in `devDependencies`, not `dependencies`. This inflates production bundle metadata (though Next.js won't bundle it into client JS, it does affect `node_modules` in server builds).

### 5. `globals.css` is Vite-era leftover

CSS contains `.logo`, `.debug`, link/button resets — all carried over from Vite starter. Most are used in the component (`logo`, `debug`, `user-info`), but the generic `a`, `button`, and `h1` resets are global and will affect all future pages unexpectedly. Fine for a starter app; worth scoping if the project grows.

### 6. Default avatar calculation uses BigInt — may throw on non-numeric IDs

**File:** `apps/client/src/components/discord-activity.tsx:110`

```ts
`https://cdn.discordapp.com/embed/avatars/${(BigInt(user.id) >> 22n) % 6n}.png`
```

`BigInt(user.id)` throws `SyntaxError` if `user.id` is not a valid integer string. Discord user IDs are always numeric Snowflakes, so this is safe in practice, but a defensive `parseInt` or try/catch would be more robust.

---

## Low Priority

- `turbo.json` `"extends": ["//"]` — correct for workspace root inheritance, no issue.
- `tsconfig.json` — standard Next.js 15 template, correct.
- `.gitignore` has duplicate `node_modules` entry (lines 10 and 17). Harmless.
- `layout.tsx` missing `<React.StrictMode>` — not required; Next.js App Router handles this differently.
- `page.tsx` wraps `<DiscordActivity>` in `<div className="app">` unnecessarily since layout could handle centering. Minor structural preference.

---

## Positive Observations

- Correct `"use client"` placement — only on `discord-activity.tsx`, not on page/layout (Server Components by default).
- Discriminated union `Status` type is clean and exhaustive.
- Singleton `getDiscordSdk()` prevents multiple SDK instantiations.
- `NEXT_PUBLIC_*` prefix used correctly for client-side env var exposure.
- `DISCORD_CLIENT_SECRET` never exposed to client — only used server-side. Secure.
- Error boundaries handled gracefully within the component's state machine.
- `eslint-disable-next-line @next/next/no-img-element` comment is correct — `<Image>` from next/image is inappropriate for dynamic CDN URLs like Discord avatars without a configured `remotePatterns`.
- `.gitignore` correctly excludes `.env`, `.next`, `.turbo`.

---

## Recommended Actions

1. **Fix server.js** — add `try/catch` + `response.ok` check in `/api/token` (High, prevents process crash + silent failures)
2. **Fix client token handling** — check `response.ok` before destructuring `data.access_token` (High)
3. **Fix `__dirname` in `next.config.ts`** — use ESM-safe path or remove manual dotenv call (High, currently works but fragile)
4. **Move `dotenv` to devDependencies** in `apps/client/package.json` (Medium)
5. **Scope global CSS** if project grows beyond single page (Low)

---

## Metrics

- Type coverage: strict mode, all types explicit — clean
- Build: PASS (Next.js 15.5.12, 796ms)
- TypeScript: PASS (tsc --noEmit, 0 errors)
- Linting: ESLint not configured in client (no `eslint.config.*` found) — not blocking, but worth adding

---

## Unresolved Questions

1. Is `example.env` committed as a template? (file was privacy-blocked, could not verify its contents don't include real secrets)
2. ESLint is absent from `apps/client` — intentional omission or not yet added?
3. Will the `/api/token` endpoint be rate-limited or authenticated in production, or is it open to anyone who can reach the server?
