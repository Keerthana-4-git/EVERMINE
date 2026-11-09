# Backend setup (in progress)

This guide covers the Supabase foundation currently present in EVERMINE. It does not imply that a hosted backend has been configured or that the app’s memory data is cloud-backed.

## 1. Create a Supabase project

Create a project in Supabase and keep the database password and service-role key private. The frontend needs only the project URL and anon/publishable key.

Copy `.env.example` to `.env.local`:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
```

Both settings must be present. If only one is set, EVERMINE disables local-auth fallback and reports a configuration error. The `VITE_` prefix makes values browser-visible; never put privileged secrets in these variables.

## 2. Configure authentication

The app currently supports Supabase email/password sign-up and sign-in, email verification, password-reset email, password update from the reset link, and Google OAuth initiation.

In Supabase Authentication settings:

1. Enable email/password and configure the project’s email confirmation behavior.
2. Set the site URL to the local development origin and add `http://localhost:5173/login` and `http://localhost:5173/reset-password` to allowed redirect URLs.
3. For Google OAuth, configure Google credentials in Supabase and add the Supabase callback URL to the Google provider configuration. Google OAuth is not operational until both provider configuration and a real sign-in test succeed.
4. Configure production origins and redirect URLs separately before a release.

Supabase sessions are persisted by the official client. NEVER use a service-role key in the browser.

## 3. Database migration

The initial schema is `supabase/migrations/20261109120000_initial_schema.sql`. It defines the initial profiles, photo metadata, albums, stories, prompts, timeline, books, reels, capsules, family, shared-album, wall, settings, notification, and suggestion tables; private storage buckets; RLS policies; and a database-side time-capsule unlock guard.

The local migration was statically reviewed and its missing foreign-key indexes were added. It has **not** been parsed or applied by PostgreSQL, and its RLS and Storage policies have not been tested against a Supabase project. For a first application:

1. Create a new disposable Supabase project for this test. Do not select a production project.
2. In the Supabase Dashboard, confirm the selected project and its project reference, then open **SQL Editor** and choose **New query**.
3. Open `supabase/migrations/20261109120000_initial_schema.sql` from this workspace, review the complete file, and paste its complete contents into the SQL Editor.
4. Run the query once. Confirm that the Editor reports success and inspect its output. If it fails, stop and investigate the exact error and resulting schema state; do not blindly rerun the whole migration or manually delete objects to retry.
5. In **Table Editor**, confirm the expected public tables exist. In the table/RLS controls, confirm RLS is enabled. In **Storage**, confirm all three buckets (`private-photos`, `profile-photos`, and `book-assets`) are private and inspect their policies.
6. Before considering a production application, test owner isolation and each shared-album role with separate accounts, capsule unlock enforcement, and Storage access. Record and resolve any failures in the disposable project first.

This is a one-time initial-schema script, not a repeatable repair script. No migration application, live policy test, or production change has been performed for this workspace. The Supabase CLI is not installed here; if CLI-based migration management is adopted later, use a separate reviewed workflow rather than mixing it with the Dashboard application.

## 4. Current storage boundary

The SQL migration creates private `private-photos`, `profile-photos`, and `book-assets` buckets and user-folder storage policies. The existing app still stores images as IndexedDB blobs and does not upload to these buckets, generate signed URLs, or delete cloud objects. No bucket should be treated as active until migration and storage-policy tests have passed.

Existing local photos are not uploaded or deleted by enabling Supabase auth. A migration/import screen and resumable upload workflow still need to be implemented before users can move data to cloud storage.

## 5. Integrations not yet implemented

- Service-layer CRUD for the existing memory pages and Supabase tables.
- Local-to-cloud import, conflict handling, signed URLs, and safe cloud photo deletion.
- Secure server-side shared-album invitation/acceptance/email workflow.
- Supabase Edge Functions, email provider, and invitation templates.
- Server-side AI function and secret/consent/usage controls.
- Realtime collaboration and cross-device notifications.
- Account deletion, data export, retention/purge automation, privacy policy, and terms.
- Vercel deployment and production callback configuration.

No Supabase project, email provider, Google OAuth credentials, AI key, or deployment URL has been configured for this workspace.
