# Phase 01 — Scaffold Monorepo

## Steps

### 1. Move app directories

```bash
mkdir -p apps
mv client apps/client
mv server apps/server
```

### 2. Delete per-package lock files

```bash
rm apps/client/package-lock.json
rm apps/server/package-lock.json
```

### 3. Create root `package.json`

`/package.json`
```json
{
  "name": "getting-started-activity",
  "private": true,
  "workspaces": [
    "apps/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  }
}
```

### 4. Create `turbo.json`

`/turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "outputs": ["dist/**"]
    }
  }
}
```

### 5. Update `apps/client/package.json` — rename for workspace clarity

Change `"name"` from `"getting-started-activity"` to `"client"`:

```json
{
  "name": "client",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^5.0.8"
  }
}
```

### 6. Update `apps/server/package.json` — add dev script using `node`

```json
{
  "name": "server",
  "version": "1.0.0",
  "description": "",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "dev": "node server.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "dotenv": "^17.0.0",
    "express": "^4.18.2",
    "node-fetch": "^3.3.2"
  }
}
```

> Note: `"dev": "npm start"` replaced with `"dev": "node server.js"` so Turborepo can invoke it directly without npm.

### 7. Install dependencies

```bash
yarn install
```

This generates the unified `yarn.lock` at the repo root and hoists shared deps into root `node_modules`.
