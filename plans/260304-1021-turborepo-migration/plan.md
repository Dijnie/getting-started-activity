---
title: "Migrate Discord Activity to Turborepo + Yarn Workspaces"
description: "Reorganize client/server into apps/* monorepo with Turborepo task orchestration"
status: pending
priority: P2
effort: 30m
branch: main
tags: [turborepo, yarn-workspaces, monorepo, refactor]
created: 2026-03-04
---

# Turborepo Migration Plan

## Goal

Convert flat `client/` + `server/` layout into a Yarn Classic workspace monorepo under `apps/`, orchestrated by Turborepo.

## Why

- Unified `yarn.lock` replaces two `package-lock.json` files
- `turbo run dev` starts both apps in parallel with one command
- Establishes clean structure for future expansion

## Scope

No new features, no shared packages — pure reorganization + tool addition.

## Target Structure

```
getting-started-activity/
├── package.json        # root: workspaces + turbo devDep
├── turbo.json          # task definitions
├── yarn.lock
├── .gitignore          # + .turbo
└── apps/
    ├── client/         # moved from client/
    └── server/         # moved from server/
```

## Phases

| # | File | What |
|---|------|------|
| 1 | phase-01-scaffold-monorepo.md | Create root files, move dirs, delete old lock files |
| 2 | phase-02-update-configs.md | Fix path references in vite.config.js, server.js, .gitignore, renovate.json |

## Files Changed

| File | Action |
|------|--------|
| `package.json` | Create (root) |
| `turbo.json` | Create |
| `yarn.lock` | Create (via `yarn install`) |
| `apps/client/` | Move from `client/` |
| `apps/server/` | Move from `server/` |
| `apps/client/package-lock.json` | Delete |
| `apps/server/package-lock.json` | Delete |
| `apps/client/vite.config.js` | Update `envDir` |
| `apps/server/server.js` | Update dotenv path |
| `.gitignore` | Append `.turbo` |
| `renovate.json` | No change needed |

## Risks

- `server.js` uses ES module (`type: module`) — dotenv path fix must use `import.meta.url`, not `__dirname`
- Yarn Classic hoists deps; if `node-fetch` version conflict arises, add `nohoist` rule

## Post-Migration Verification

```bash
yarn install          # generates yarn.lock, no errors
turbo run dev         # both apps start
curl localhost:3001   # server responds
```
