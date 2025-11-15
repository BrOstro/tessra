# Copilot Instructions for Tessra

## Repository Overview

**Tessra** is a full-stack web application for image upload, storage, and OCR (Optical Character Recognition) text extraction. It's built as a monorepo using npm workspaces with a Nuxt.js frontend/backend and modular TypeScript packages.

**Tech Stack:**
- **Framework:** Nuxt 4 (Vue 3, TypeScript, Server-Side Rendering)
- **Database:** PostgreSQL 17.6 with Drizzle ORM
- **Cache/Queue:** Redis 8.2.3 with BullMQ for job processing
- **Storage:** Local filesystem or S3-compatible object storage
- **OCR:** Tesseract.js for text extraction from images
- **UI:** Nuxt UI components with Tailwind CSS
- **Runtime:** Node.js 24.x (builds with 20.x but shows warnings)

**Repository Size:** ~35 source files, ~1100 npm packages, builds in ~10 seconds

## Project Structure

```
tessra/
├── .github/                    # GitHub configuration (currently no workflows)
├── apps/
│   └── web/                    # Main Nuxt application
│       ├── app/                # Frontend Vue components and pages
│       │   ├── pages/          # Route pages (index, login, admin)
│       │   ├── components/     # Vue components
│       │   ├── composables/    # Vue composables (useAuth.ts)
│       │   ├── middleware/     # Route middleware (auth.ts)
│       │   └── plugins/        # Client-side plugins
│       ├── server/             # Backend Nitro server
│       │   ├── api/            # API endpoints (admin/*, auth/*, upload)
│       │   ├── routes/         # Server routes (uploads/[id].get.ts)
│       │   ├── lib/            # Shared server libraries (db, redis, jobs, sessions)
│       │   ├── plugins/        # Server plugins (numbered 01-04 for load order)
│       │   └── utils/          # Server utilities (auth, csrf, rateLimit, s3, settings)
│       ├── db/                 # Database schema (schema.ts)
│       ├── drizzle/            # Generated SQL migrations
│       ├── public/             # Static assets (favicon, robots.txt)
│       ├── .env.example        # Environment variable template
│       ├── drizzle.config.ts   # Drizzle ORM configuration
│       ├── eslint.config.mjs   # ESLint configuration (uses Nuxt defaults)
│       ├── nuxt.config.ts      # Nuxt configuration
│       └── package.json        # Web app dependencies
├── packages/                   # Shared TypeScript packages
│   ├── core/                   # Core interfaces (storage, ocr, vision, search)
│   └── drivers/                # Implementation drivers
│       ├── storage-local/      # Local filesystem storage
│       ├── storage-s3/         # S3-compatible storage
│       └── ocr-tesseract/      # Tesseract.js OCR implementation
├── docker-compose.yml          # PostgreSQL + Redis containers
├── package.json                # Root workspace configuration
├── railway.json                # Railway deployment configuration
└── tsconfig.json               # TypeScript configuration
```

## Environment Setup

### Prerequisites
- **Node.js:** 24.x recommended (20.x works but shows EBADENGINE warnings)
- **npm:** 10.x
- **Docker & Docker Compose:** For PostgreSQL and Redis

### Initial Setup Steps

1. **Install dependencies** (ALWAYS run this first after cloning):
   ```bash
   npm install
   ```
   **Time:** ~2 minutes. Installs 1067 packages. Warnings about Node.js version and deprecated packages are expected and safe to ignore.

2. **Start Docker services** (REQUIRED before running app):
   ```bash
   docker compose up -d
   ```
   **Services:** PostgreSQL (port 5432) and Redis (port 6379)
   **Note:** First run pulls images (~161MB), takes ~30 seconds. Subsequent runs are instant.
   
   **Verify services are healthy:**
   ```bash
   docker compose ps
   ```
   Both services should show "Up X seconds (healthy)"

3. **Create environment file:**
   ```bash
   cd apps/web
   cp .env.example .env
   ```
   **Default values are configured for local development.** Edit `.env` if you need to:
   - Change `ADMIN_TOKEN` (default: `change-me-please-32chars`)
   - Enable OCR (`OCR_ENABLED=true`)
   - Switch to S3 storage (`STORAGE_DRIVER=s3`)

4. **Push database schema** (REQUIRED on first run or after schema changes):
   ```bash
   npm run db:push
   ```
   **Note:** This command is interactive and prompts for confirmation. The prompt navigation:
   - Default selection is "No, abort"
   - Use arrow keys to select "Yes, I want to execute all statements"
   - Press Enter to confirm
   
   **Alternative:** If the database already has the schema, `npm run db:generate` will show "No schema changes, nothing to migrate 😴"

## Build, Run, and Validation

### Development Server
```bash
npm run dev
```
**What it does:** Starts Nuxt dev server at http://localhost:3000 with hot reload
**Time:** ~5 seconds to start
**Location:** Runs from `apps/web` workspace

### Production Build
```bash
npm run build
```
**What it does:** Compiles client and server bundles for production
**Time:** ~10 seconds (6s client + 2.5s server + 1.5s Nitro)
**Output:** `apps/web/.output/` directory
**Expected warnings:** Font provider connectivity errors (api.fontshare.com, api.fontsource.org) are harmless if fonts are cached
**Build artifacts:** 
- Client: ~355KB main bundle (gzipped: ~123KB)
- Server: ~210KB Nitro runtime (gzipped: ~53KB)
- Total size: ~47MB uncompressed (~19MB gzipped) includes sharp image processing binaries

**Important:** Clean build artifacts before rebuilding if encountering issues:
```bash
rm -rf apps/web/.nuxt apps/web/.output
npm run build
```

### Start Production Server
```bash
npm run start
```
**Prerequisites:** Must run `npm run build` first
**What it does:** Starts production server using built artifacts

### Database Commands

**Generate migrations** (create SQL files from schema changes):
```bash
npm run db:generate
```

**Push schema to database** (apply schema without migrations):
```bash
npm run db:push
```

**Open Drizzle Studio** (database GUI):
```bash
npm run db:studio
```

### Linting and Testing

**No linting command is defined.** ESLint is installed (`@nuxt/eslint`, `eslint@9.39.1`) but no `lint` script exists in package.json.

**No test files exist.** `@nuxt/test-utils` is installed but no test scripts or test files are present.

**To validate changes:**
1. Ensure Docker services are running
2. Run `npm run build` - build must succeed without errors
3. If changing database schema, run `npm run db:generate` or `npm run db:push`
4. If changing server code, start dev server and test endpoints manually

## Key Configuration Files

- **Root:**
  - `package.json` - Workspace configuration, delegates scripts to `apps/web`
  - `tsconfig.json` - TypeScript base config with path aliases (`@tessra/core/*`, `@tessra/drivers/*`)
  - `docker-compose.yml` - PostgreSQL and Redis service definitions

- **apps/web:**
  - `nuxt.config.ts` - Nuxt configuration, runtime config, module setup
  - `drizzle.config.ts` - Database connection and migration settings
  - `eslint.config.mjs` - Extends `.nuxt/eslint.config.mjs` (auto-generated)
  - `.env` - Environment variables (create from `.env.example`)

## Architecture Details

### Monorepo Workspaces
The repository uses npm workspaces. Root scripts delegate to `apps/web`:
- `npm run dev` → `npm --workspace apps/web run dev`
- `npm run build` → `npm --workspace apps/web run build`

### Database Schema
Single schema file: `apps/web/db/schema.ts`
- Tables: `uploads`, `sessions`, `settings`
- Uses Drizzle ORM with PostgreSQL dialect
- Migrations stored in `apps/web/drizzle/`

### Storage Architecture
Pluggable storage via `@tessra/core/storage` interface:
- Local: `@tessra/drivers/storage-local` (default)
- S3: `@tessra/drivers/storage-s3`
- Configured via `STORAGE_DRIVER` env var

### Job Queue System
BullMQ-based async job processing. See `apps/web/server/jobs/README.md` for detailed documentation.
- **Current job:** `ocr:process` (server/plugins/03.queue.ts)
- **Redis connection:** Singleton managed by `server/lib/redis.ts`
- **Job registry:** `server/lib/jobs.ts` provides `registerJobProcessor()` and `enqueueJob()`
- **Worker:** Started in `server/plugins/03.queue.ts`

### Server Plugins Load Order
Plugins are numbered to control initialization sequence:
1. `01.ocr.ts` - Initialize OCR provider
2. `02.storage.ts` - Initialize storage provider
3. `03.queue.ts` - Start job queue worker
4. `04.sessions.ts` - Setup session cleanup

### API Routes
- **Admin:** `/api/admin/*` - Admin endpoints (protected by auth middleware)
- **Auth:** `/api/auth/*` - Login, logout, session, CSRF
- **Upload:** `/api/upload` - File upload endpoint
- **Uploads:** `/uploads/:id` - Serve uploaded files

### Authentication
- Bearer token authentication via `ADMIN_TOKEN` env var
- Session-based web authentication with HTTP-only cookies
- CSRF protection for state-changing operations
- Auth middleware: `apps/web/server/utils/auth.ts`
- Session management: `apps/web/server/lib/sessions.ts`

## Common Issues and Workarounds

### Issue: Node.js version warnings during `npm install`
**Symptom:** `npm warn EBADENGINE Unsupported engine { package: undefined, required: { node: '24.x' }, current: { node: 'v20.19.5' } }`
**Impact:** None. Installation and build work normally.
**Fix:** Upgrade to Node.js 24.x if warnings are a concern, but not required.

### Issue: Build fails with font provider errors
**Symptom:** `getaddrinfo ENOTFOUND api.fontshare.com` or similar
**Impact:** None if fonts are cached. Build completes successfully.
**Fix:** No action needed. These are warnings, not errors.

### Issue: `db:push` hangs after "Pulling schema from database..."
**Symptom:** Interactive prompt appears with "No, abort" selected
**Cause:** Command requires manual confirmation
**Fix:** Use arrow keys to select "Yes, I want to execute all statements" and press Enter

### Issue: Build artifacts cause unexpected behavior
**Symptom:** Stale or incorrect output after code changes
**Fix:** Clean build artifacts: `rm -rf apps/web/.nuxt apps/web/.output` then rebuild

### Issue: "Cannot connect to database" errors
**Symptom:** Database connection failures during build or runtime
**Fix:** Ensure Docker services are running: `docker compose up -d`
**Verify:** Check health: `docker compose ps`

## Deployment

**Railway:** Configuration in `railway.json`
- Build: `npm install && npm run build`
- Start: `npm run db:push && node apps/web/.output/server/index.mjs`
- Auto-deploys on push with database migration

## Instructions for Coding Agents

1. **Always start with Docker:** Run `docker compose up -d` before any development work
2. **Always install dependencies first:** Run `npm install` after cloning or switching branches
3. **Build early and often:** Run `npm run build` after making changes to catch TypeScript errors
4. **No tests exist:** Focus validation on successful builds and manual testing
5. **Database changes:** If modifying `apps/web/db/schema.ts`, run `npm run db:generate` to create migrations
6. **Workspace awareness:** Root `package.json` scripts delegate to `apps/web`. Run scripts from root for consistency.
7. **Plugin load order matters:** Server plugins are numbered (01-04). Maintain sequence if adding new plugins.
8. **Environment variables:** Never commit `.env` files. Use `.env.example` as template.
9. **Trust these instructions:** Only search for additional information if these instructions are incomplete or incorrect.

## File Inventory

**Root files:**
- `.gitignore` - Ignores: `/node_modules/`, `.nuxt/`, `.node_modules/`, `.idea/`, `.env`
- `package.json`, `package-lock.json` - Workspace configuration
- `tsconfig.json` - TypeScript configuration
- `docker-compose.yml` - Services: PostgreSQL 17.6, Redis 8.2.3
- `railway.json` - Deployment configuration

**Key dependencies:**
- Nuxt: 4.2.1
- Vue: 3.5.24
- Drizzle ORM: 0.44.7
- BullMQ: 5.63.0
- PostgreSQL: pg@8.16.3
- Redis: 5.9.0
- Tesseract.js: 6.0.1
- TypeScript: 5.9.3
