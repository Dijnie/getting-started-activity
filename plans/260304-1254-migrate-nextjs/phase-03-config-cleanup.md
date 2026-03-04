# Phase 3: Update Env Vars, Proxy Config & Cleanup

**Status:** Pending | **Priority:** High

## Overview

Update environment variables, finalize proxy config, clean up old files.

## Implementation Steps

1. **Update root `.env` and `example.env`**: Rename `VITE_DISCORD_CLIENT_ID` → `NEXT_PUBLIC_DISCORD_CLIENT_ID`
2. **Update `apps/server/server.js`**: Reference `NEXT_PUBLIC_DISCORD_CLIENT_ID` (or keep as separate env var)
3. **Update `.gitignore`**: Add `.next` directory, remove Vite-specific entries if any
4. **Update root `README.md`**: Document new Next.js setup
5. **Delete old files**: `apps/client/dist/`, any remaining Vite artifacts
6. **Verify build**: Run `yarn build` to ensure both apps build successfully

## Success Criteria

- `yarn dev` runs both apps
- `yarn build` succeeds
- Environment variables properly loaded in both client and server
- No leftover Vite files
