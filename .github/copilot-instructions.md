# Tessra - Copilot Development Guide

## Repository Overview

**Tessra** is an image management and OCR processing web application built with Nuxt 4. It provides:
- Image upload and storage (local filesystem or S3)
- Optional OCR text extraction using Tesseract.js
- Admin authentication with session management
- Asynchronous job processing via BullMQ and Redis
- PostgreSQL database with Drizzle ORM

**Technology Stack:**
- **Frontend/Backend**: Nuxt 4 (Vue 3.5.24) - Full-stack SSR framework
- **Runtime**: Node.js v20.19.5, npm 10.8.2
- **Database**: PostgreSQL 17.6 (via Docker)
- **Cache/Queue**: Redis 8.2.3 (via Docker)
- **ORM**: Drizzle v0.44.7 with drizzle-kit v0.31.6
- **Job Queue**: BullMQ v5.63.0
- **Linting**: ESLint v9.39.1 with @nuxt/eslint
- **Storage**: Local filesystem or AWS S3
- **OCR**: Tesseract.js v6.0.1 (optional)

**Repository Size**: Small (~1000 packages installed)

## Critical: Environment Setup

**ALWAYS perform these steps in order before any build or development work:**

1. **Install dependencies** (required even if node_modules exists):
   ```bash
   npm install
   ```
   Takes ~60-120 seconds. Safe to run multiple times.
   
   **IMPORTANT**: If you deleted node_modules and get an `ERR_MODULE_NOT_FOUND` error on first install, run `npm install` a second time. This is due to the postinstall hook running before dependencies are fully installed in workspaces.

2. **Start Docker services** (PostgreSQL and Redis):
   ```bash
   docker compose up -d
   ```
   - Uses docker-compose.yml in repo root
   - Services: postgres:17.6 on port 5432, redis:8.2.3 on port 6379
   - Note: docker-compose.yml has obsolete `version` field - ignore the warning

3. **Create environment file** (if not exists):
   ```bash
   cp apps/web/.env.example apps/web/.env
   ```
   Default values work for local development with Docker services.

4. **Initialize database schema** (optional for build, required for dev server):
   ```bash
   npm run db:push
   ```
   - This is INTERACTIVE - you'll be prompted "Yes, I want to execute all statements"
   - Navigate with arrow keys: press {down} then {enter} to accept
   - Creates tables: uploads, sessions, settings
   - Safe to run multiple times (idempotent)
   - Note: You can build without this step, but dev/preview servers will fail at runtime if database is not initialized

## Build & Development Commands

All commands should be run from the **repository root** (`/home/runner/work/tessra/tessra`).

### Build Commands

**Build for production** (takes ~120-180 seconds):
```bash
npm run build
```
- Runs `nuxt build` in apps/web workspace
- May show warnings about fonts.google.com (safe to ignore)
- Outputs to `apps/web/.output/`
- Success indicator: creates `apps/web/.output/server/index.mjs`

**Clean build** (if needed):
```bash
rm -rf apps/web/.nuxt apps/web/.output
npm run build
```

### Development Server

**Start dev server**:
```bash
npm run dev
```
- Runs `nuxt dev` on http://localhost:3000
- Requires Docker services running
- Supports hot module reload

**Preview production build**:
```bash
npm run start
```
- Requires successful `npm run build` first
- Runs `nuxt preview`

### Database Commands

**Generate migrations** (from schema changes):
```bash
npm run db:generate
```
- Reads `apps/web/db/schema.ts`
- Outputs to `apps/web/drizzle/`

**Push schema to database**:
```bash
npm run db:push
```
- INTERACTIVE: requires manual confirmation
- Use arrow keys + enter to select "Yes, I want to execute all statements"

**Open Drizzle Studio** (database GUI):
```bash
npm run db:studio
```

### Linting

**Run ESLint**:
```bash
cd apps/web && npx eslint .
```
- Currently shows 9 errors (pre-existing)
- Known issues: @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
- Do NOT fix unrelated linting errors unless your changes require it

## Project Architecture

### Monorepo Structure

```
tessra/
├── apps/
│   └── web/                    # Main Nuxt application
│       ├── app/                # Frontend Vue components & pages
│       │   ├── components/     # Vue components (admin settings, etc.)
│       │   ├── composables/    # Vue composables (useAuth.ts)
│       │   ├── middleware/     # Route middleware (auth.ts)
│       │   ├── pages/          # Route pages (index, admin, login)
│       │   └── plugins/        # Client plugins (auth-init.client.ts)
│       ├── db/
│       │   └── schema.ts       # Drizzle schema (uploads, sessions, settings)
│       ├── server/             # Nitro server-side code
│       │   ├── api/            # API routes (auth, admin, upload)
│       │   ├── lib/            # Server utilities (db, redis, jobs, queue)
│       │   ├── plugins/        # Server plugins (storage, queue workers)
│       │   ├── routes/         # Server routes (file serving)
│       │   └── utils/          # Shared utilities (auth, csrf, s3, settings)
│       ├── .env.example        # Environment template
│       ├── drizzle.config.ts   # Drizzle configuration
│       ├── eslint.config.mjs   # ESLint configuration
│       ├── nuxt.config.ts      # Nuxt configuration (aliases, runtime config)
│       └── package.json        # Web app dependencies
├── packages/
│   ├── core/                   # Core abstractions (storage, ocr, vision, search)
│   │   ├── storage.ts          # StorageProvider interface
│   │   ├── ocr.ts              # OCR interfaces
│   │   ├── vision.ts           # Vision API interfaces
│   │   └── search.ts           # Search interfaces
│   └── drivers/                # Provider implementations
│       ├── storage-local/      # Local filesystem storage
│       ├── storage-s3/         # AWS S3 storage
│       └── ocr-tesseract/      # Tesseract OCR implementation
├── docker-compose.yml          # PostgreSQL + Redis services
├── package.json                # Root workspace config
└── tsconfig.json               # Root TypeScript config
```

### Key Configuration Files

- **apps/web/nuxt.config.ts**: Nuxt configuration, runtime config, module aliases
  - Defines `@tessra/core` and `@tessra/drivers` path aliases
  - Runtime config from environment variables
  - Prints environment check on startup

- **apps/web/drizzle.config.ts**: Database ORM configuration
  - Uses DATABASE_URL from .env
  - Schema at `./db/schema.ts`, migrations at `./drizzle/`

- **apps/web/eslint.config.mjs**: ESLint configuration
  - Uses @nuxt/eslint preset from `.nuxt/eslint.config.mjs`

- **tsconfig.json**: Root TypeScript config
  - Path mappings for `@tessra/core/*` and `@tessra/drivers/*`
  - ES2022 target, ESNext module, Bundler resolution

- **docker-compose.yml**: Local development services
  - PostgreSQL 17.6: port 5432, credentials postgres/postgres
  - Redis 8.2.3: port 6379, no persistence

### Database Schema

Located in `apps/web/db/schema.ts`:

**uploads table**: Stores uploaded images
- id (uuid), objectKey, mime, sizeBytes, width, height
- sha256, visibility (public/private), title, ocrText, caption, tags
- createdAt, expiresAt

**sessions table**: Admin authentication sessions
- id (uuid), token, createdAt, expiresAt, lastActivityAt

**settings table**: App-wide settings
- key (primary), value, updatedAt

### Job Queue System

**Architecture**: BullMQ + Redis for async processing
- **Registry**: `apps/web/server/lib/jobs.ts` - Job processor registry
- **Queue**: `apps/web/server/lib/queue.ts` - Queue initialization & OCR job
- **Worker**: Started in `apps/web/server/plugins/queue.ts`
- **Documentation**: `apps/web/server/jobs/README.md`

**Current Job Types**:
- `ocr:process`: Extract text from images (enabled when OCR_ENABLED=true)

**Adding new jobs**: See `apps/web/server/jobs/README.md` for detailed guide.

### Authentication

- Admin-only access via `ADMIN_TOKEN` environment variable
- Bearer token for API, secure HTTP-only cookies for web UI
- Session management in PostgreSQL
- CSRF protection for state-changing operations
- Middleware: `apps/web/app/middleware/auth.ts`
- Utility: `apps/web/server/utils/auth.ts`

### Storage System

**Pluggable storage backend** via `@tessra/core/storage` interface:
- **Local**: `@tessra/drivers/storage-local` - filesystem storage
- **S3**: `@tessra/drivers/storage-s3` - AWS S3 compatible storage

**Configuration** (in .env):
- STORAGE_DRIVER=local or s3
- Local: LOCAL_ROOT, LOCAL_PUBLIC_BASE
- S3: S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY

Storage provider initialized in `apps/web/server/plugins/02.storage.ts`.

## Common Issues & Workarounds

### Build Issues

**Issue**: Build hangs on "Could not fetch from fonts.google.com"
- **Status**: Normal behavior in restricted network environments
- **Solution**: Wait 3-5 minutes, build will continue after retries
- **Initial wait recommendation**: Use 180+ seconds for `npm run build`

**Issue**: Build artifacts from previous build interfere
- **Solution**: Clean before building:
  ```bash
  rm -rf apps/web/.nuxt apps/web/.output
  npm run build
  ```

### Database Issues

**Issue**: "db:push" hangs waiting for input
- **Cause**: Interactive prompt for schema changes
- **Solution**: Provide input via arrow keys {down} + {enter}

**Issue**: Database connection errors
- **Cause**: Docker services not running
- **Solution**: 
  ```bash
  docker compose ps  # Check status
  docker compose up -d  # Start if needed
  ```

### ESLint Pre-existing Issues

The codebase has 9 known ESLint errors:
- 7x @typescript-eslint/no-explicit-any
- 2x @typescript-eslint/no-unused-vars

**DO NOT** fix these unless:
1. You're modifying the affected file for your task
2. The fix is part of your assigned work

### Environment Variables

**Critical variables** for development (from .env):
- DATABASE_URL: PostgreSQL connection (default works with Docker)
- REDIS_URL: Redis connection (default works with Docker)
- ADMIN_TOKEN: Authentication (default is insecure "change-me-please-32chars")

**Optional variables**:
- OCR_ENABLED: Enable OCR processing (default: false)
- STORAGE_DRIVER: local or s3 (default: local)
- DEFAULT_VISIBILITY: public or private (default: private)

## Validation Steps

**Before committing changes**, run these validation steps:

1. **Lint your changes**:
   ```bash
   cd apps/web && npx eslint <file-you-changed>
   ```

2. **Build the application**:
   ```bash
   npm run build
   ```
   Must complete successfully.

3. **If you changed database schema**:
   ```bash
   npm run db:generate  # Generate migration
   npm run db:push      # Apply to local database
   ```

4. **Test the application** (if possible):
   ```bash
   npm run dev
   ```
   Navigate to http://localhost:3000

## Important Notes for Coding Agents

1. **Trust these instructions**: Only search for additional information if these instructions are incomplete or incorrect for your specific task.

2. **Always use absolute paths**: Repository is at `/home/runner/work/tessra/tessra`

3. **Workspace commands**: All npm scripts at root delegate to `apps/web` workspace.

4. **No test suite**: This repo includes `@nuxt/test-utils` but no test files exist yet. Don't create tests unless specifically requested.

5. **Type-safe packages**: The `packages/` directory contains TypeScript source (not compiled). Nuxt imports them directly via path aliases.

6. **File serving**: Uploaded files served via `apps/web/server/routes/uploads/[id].get.ts`

7. **Build time**: Production builds take 2-3 minutes. Use `initial_wait: 180` or higher.

8. **Interactive commands**: `db:push` requires user input - use write_bash with arrow keys.

9. **Docker dependency**: Database and Redis MUST be running via Docker for any build/dev work.

10. **Module resolution**: Uses "Bundler" resolution (not Node). Import from `@tessra/core/*` and `@tessra/drivers/*` as defined in tsconfig paths.
