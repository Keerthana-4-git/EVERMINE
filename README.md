# EVERMINE

**Every moment deserves to be remembered.**

EVERMINE is a personal memory archive built with React, TypeScript, Vite, Tailwind CSS, and a quiet-luxury editorial design system.

## Product status

The existing Stages A–G work as a local-first application. Photos, memory records, preferences, and the original demo account are stored in the browser; this existing data is not automatically transferred or uploaded.

Supabase foundations have been added for authentication and a PostgreSQL schema. When configured, Supabase email/password and Google OAuth authentication can be used. The application’s memory pages still read and write local IndexedDB, however, so authentication does **not** currently make memory content cloud-backed or available on other devices. The SQL migration has not been applied to a hosted project, and this application is not deployed.

## Features currently implemented

- Memory library, favorites, albums, timeline, On This Day, stories, and prompts.
- Digital memory books and slideshow reels.
- Time capsules, Family Legacy, local Shared Albums, and deterministic local Curator suggestions.
- Memory Wall, profile and settings, Recently Deleted, notifications, and Help & FAQ.
- Recoverable photo deletion and local persistence through IndexedDB.
- Optional Supabase authentication foundation and a PostgreSQL/RLS migration (setup required).

Shared album invitations, curator recommendations, support contact, and the local demo authentication are not production cloud services. AI suggestions are generated locally from metadata; no photos are sent to an AI provider.

## Technology

- React 19, TypeScript, Vite, React Router
- Tailwind CSS 4, Framer Motion, Lucide React
- IndexedDB for the existing local archive
- Supabase JS client for optional authentication
- Supabase PostgreSQL migration under `supabase/migrations/`

## Local development

```sh
npm install
npm run dev
npm run build
npm run lint
```

Without Supabase environment variables, the existing clearly-labelled local demo authentication remains available. Do not use it as production authentication.

## Supabase setup

See [BACKEND_SETUP.md](./BACKEND_SETUP.md) before configuring a Supabase project. Copy `.env.example` to `.env.local` and set only the browser-safe project URL and anon/publishable key. Never put service-role, database, AI-provider, or email-provider secrets in `VITE_*` variables.

The first migration defines core product tables, private storage buckets, RLS policies, shared-album permission helpers, and a database-side time-capsule unlock guard. It is an initial implementation, not a substitute for reviewing and testing policies against a real Supabase project before production.

## Testing

`npm run build` performs the TypeScript project build and Vite production build. `npm run lint` runs Oxlint. At this stage there is no automated unit, integration, or end-to-end test suite, and no hosted Supabase migration/auth test has been run.

## Deployment

There is no verified production deployment. Vercel and Supabase deployment instructions are documented as future setup steps in [BACKEND_SETUP.md](./BACKEND_SETUP.md); do not treat the repository as release-ready until the pending work in [PROJECT_STATUS.md](./PROJECT_STATUS.md) is complete.
