# EVERMINE implementation status

Updated: 2026-11-09 (final change-recovery and project-health checkpoint)

## Supabase migration audit checkpoint

The local migration `supabase/migrations/20261109120000_initial_schema.sql` was statically audited. No SQL was applied to Supabase, no IndexedDB records were read or changed, and no credentials were accessed or displayed.

- The schema declares 39 public tables. Static inspection found RLS enabled directly or by the migration's owner-policy loop for all 39 tables.
- The migration contains 111 generated/explicit table policies and 5 Storage policies. The `private-photos`, `profile-photos`, and `book-assets` buckets are declared private with MIME and size limits.
- A security review found no exploitable vulnerabilities in the migration. Shared-album checks distinguish viewers, contributors, and editors; invitations do not have a database insert/accept workflow and remain unimplemented for the cloud backend.
- The database trigger blocks opening a sealed time capsule before its unlock time. This was reviewed statically only.
- Static FK-index coverage found 58 missing indexes. Those indexes have been added to the local migration, covering the FK columns not already indexed by a primary key, unique constraint, or existing index.
- No ownership-policy or relationship constraint was changed. This does not constitute a live two-user authorization test or prove that every cross-table reference is tenant-consistent.
- No PostgreSQL parser, Supabase CLI, or configured Supabase project is available here. SQL syntax, migration execution, RLS behavior, and Storage behavior remain unverified against PostgreSQL.
- Post-change static index check: all 39 public tables were found and every declared FK column is covered by a leading PK/unique/index column. The migration has 63 explicit indexes after the 58 additions.
- `npm run build`: passed (`tsc -b` and Vite production build); Vite emitted a large-chunk advisory for the 666.40 kB main bundle.
- `npm run lint`: passed with two warnings: React Compiler compatibility at `src/pages/AuthPage.tsx:140` and `react(set-state-in-effect)` at `src/data/MemoryProvider.tsx:189`.
- These frontend checks do not parse or validate the SQL migration.

### Applying the reviewed migration later

The migration remains unapplied. Follow the safe SQL Editor procedure in `BACKEND_SETUP.md` against a new/disposable Supabase project first. Do not use production for the first application, and do not rerun it blindly after a partial failure. Run two-user RLS and Storage tests before any production decision. This audit did not start photo migration or deployment.

## Existing application

- Stages A–G remain in the project and continue to use local IndexedDB and local demo authentication.
- No local photos or other existing browser data were migrated, overwritten, or deleted.
- Shared album and curator features remain local demonstrations; the local curator does not call an AI provider.

## Final recovery and workspace audit

### Changes confirmed saved in the workspace

The following implementation is present in the saved workspace:

- Supabase SDK dependency in `package.json` and corresponding lockfile.
- `.env.example`, secret exclusions in `.gitignore`, Supabase client/auth service, auth context integration, reset-password page and route, and the auth UI changes.
- The Stage A–G components and pages, including `src/components/PhotoViewer.tsx` and its Recently Deleted action.
- `supabase/migrations/20261109120000_initial_schema.sql`, `BACKEND_SETUP.md`, `README.md`, and this checkpoint.

No build, lint, or audit step removed or reset application files or browser data.

### Keep proposal / unsaved editor changes

The reported Keep error named `AuthLayout.tsx`, `auth-context.ts`, `PhotoView...`, and other files. The saved versions of `src/layouts/AuthLayout.tsx`, `src/auth/auth-context.ts`, and `src/components/PhotoViewer.tsx` are present and compile. The supplied `src/auth/authStorage.ts` is also present and was not changed in this audit.

No proposal/diff recovery interface or complete Keep error diff was available in this workspace session. Therefore any additional editor-buffer-only changes cannot be compared to disk or recovered here. The exact known files whose proposal-only differences remain unverifiable are `src/layouts/AuthLayout.tsx`, `src/auth/auth-context.ts`, and `src/components/PhotoViewer.tsx`; the error also said “other files” without providing their complete names. This does **not** establish that there are unsaved changes; their existence and contents are unknown. Do not overwrite or discard any open editor proposal. Compare and resolve any remaining VS Code Keep/working-set entries manually against these saved files before considering editor state fully reconciled.

### Health and secrets audit

- `npm run build`: passed during this checkpoint.
- `npm run lint`: passed with two warnings: React Hook Form compatibility in `src/pages/AuthPage.tsx` and a state-in-effect warning in `src/data/MemoryProvider.tsx`.
- `npm run dev -- --host 127.0.0.1 --port 5182`: Vite started and served the app shell with HTTP 200; the temporary server was stopped afterward.
- `.gitignore` excludes `.env`, `.env.*`, and `*.local`, while explicitly allowing `.env.example`.
- `.env.example` contains only the names of the two public Supabase configuration variables with blank values. No real `.env` file or configured secret values were found in the workspace/environment audit. Secret values were not printed.
- Static inspection counted 39 public tables and confirmed explicit or generated RLS enablement for all 39. This is not SQL parsing or database policy testing.
- The workspace is not currently a Git repository (`.git` is absent), so there is no Git diff/status to prove editor-buffer state or tracked-file status. No GitHub remote or deployment was created.

### GitHub preparation

The saved source can be prepared for GitHub after manually reconciling any outstanding VS Code editor proposals. Before the first commit:

1. Review and resolve the editor's remaining Keep/conflict indicators; save intended changes and inspect the resulting source.
2. Initialize Git only if desired, then inspect `git status --short` and `git diff --check`.
3. Confirm real `.env` files, keys, credentials, database passwords, local memory exports, and private photos are absent from the staged change. Stage `.env.example` only if its values remain blank.
4. Review the SQL migration and documentation; do not describe the application as production-ready.
5. Commit and configure a GitHub remote only after the above checks. These GitHub setup actions were not performed in this audit.

## Completed in this production-foundation pass

- Added `@supabase/supabase-js`.
- Added browser-safe Supabase environment configuration with explicit incomplete-config errors and no privileged keys.
- Added Supabase Auth service calls for email/password signup/login, email verification redirect, password reset and update, Google OAuth initiation, and profile-name metadata update.
- Wired auth context and routes to use Supabase when configured while preserving labelled local-demo behavior when no Supabase environment values are present.
- Added reset-link password update UI at `/reset-password`.
- Added a first PostgreSQL schema/RLS/storage migration at `supabase/migrations/20261109120000_initial_schema.sql`.
- In Supabase-auth mode, the existing IndexedDB provider scopes its local records by authenticated user UUID, keeping old email-keyed demo records separate rather than silently exposing or importing them.
- Added `.env.example`, secret ignores, `BACKEND_SETUP.md`, and updated README product-status documentation.
- Updated account UI copy to distinguish connected authentication from still-local memory data.

## Verification completed

- `npm run build` passed after the Supabase/auth foundation changes.
- `npm run lint` passed with two warnings: the existing React Hook Form compatibility warning in `src/pages/AuthPage.tsx` and a state-in-effect warning in `src/data/MemoryProvider.tsx`.
- Static migration inspection found 39 declared public tables and confirmed explicit or generated RLS enablement on all 39; 67 policies are present. This is not a substitute for PostgreSQL parsing or two-user policy tests.
- Browser smoke-tested `/`, `/memories`, `/memory-wall`, `/profile`, `/reset-password`, and `/help` using the existing local-demo session; the local reset route correctly identified that no Supabase backend is configured.
- No `psql` or Supabase CLI is installed; the migration has not been parsed/applied by PostgreSQL, tested against RLS, or deployed.
- No Supabase credentials/provider settings are available, so real email confirmation, reset emails, Google OAuth, and authenticated flows have not been tested.
- Memory CRUD, photo storage, and all Stage A–G pages still use IndexedDB. There is no cross-device synchronization.

## Required next implementation steps

1. Validate and revise the migration using a disposable Supabase project; test every table/storage policy with at least two users and all shared-album permission levels. Fix relationship ownership constraints before treating RLS as production-safe.
2. Add generated database types and isolated profile/photo/album services; implement authenticated profile persistence and Supabase-backed user data.
3. Implement a user-consented local-data import with progress, retry/resume, integrity checks, and no automatic local deletion.
4. Replace IndexedDB photo reads/writes with private Storage upload, signed-URL display, and safe soft-delete/restore/purge while maintaining legacy/local fallback.
5. Migrate each existing feature to backend services and test per-user authorization and capsule eligibility.
6. Implement Edge Functions for invitations, email, AI, rate limits, and other privileged operations; add secrets only through Supabase server-side configuration.
7. Add automated unit, database/RLS, integration, and end-to-end tests, then run accessibility and mobile checks.
8. Complete account deletion/export, retention rules, privacy/terms review, production environment configuration, Vercel deployment, and verify a real deployment URL.

## Release status

**Not production-ready and not deployed.** External Supabase, OAuth, email, AI, and hosting configuration are required. Authentication foundation must not be confused with cloud storage: photographs and memory data remain local until the migration and backend integration steps above are complete.
