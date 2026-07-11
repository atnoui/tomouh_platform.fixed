# Tomouh — طموح

A bilingual (French / Arabic) platform connecting students in Algeria with free book
loans, notebook bundles for students in need, and educational podcasts — built on
Next.js 14 (App Router) and your live Supabase project **tomouh_project**.

This README only covers the handful of things that genuinely can't be done from
inside the codebase (secrets, and two one-time clicks in the Supabase dashboard).
Everything else — schema, RLS, pages, components — is already in this repo and
already applied to your database.

---

## 1. What was already in your Supabase project

`tomouh_project` (ref `behftzxktknfkbqindck`) already contained a schema clearly
built for exactly this product, so the app is wired directly to it instead of
creating a parallel set of tables:

| Brief asked for...        | Already existed as...        | What this repo added |
|---|---|---|
| Profiles / Users          | `public.profiles`             | `parent_phone`, `is_indigent` columns |
| Orders                    | `public.book_requests`        | `book_id`, `book_title`, `bundle_name`, `expires_at` columns + 15-day loan trigger |
| Inventory (books/bundles) | `public.books`                | admin write policy |
| Podcasts                  | *(none)*                      | new `public.podcasts` table |
| —                         | `public.wilayas` (58 seeded)  | public read policy |
| —                         | storage bucket `aid-documents`| owner/admin RLS policies |

The full, idempotent migration is in [`supabase/migration.sql`](./supabase/migration.sql)
and has **already been applied** to your database. It only adds columns/tables/
policies — nothing existing was dropped or rewritten.

Your project also still contains an older, unrelated set of tables (`public.users`,
`public.aid_requests`, `public.registrations`, `public.user_registrations`, and a
generic LMS — `courses`/`videos`/`enrollments`/`user_streaks`). Those were left
completely untouched and the app does not read from or write to them. Once you've
confirmed they're unused you may want to drop them, but that's a deliberate call
for you to make later — not something this migration does.

---

## 2. One-time setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://behftzxktknfkbqindck.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...        # Project Settings → API
SUPABASE_SERVICE_ROLE_KEY=...            # Project Settings → API (keep secret!)
ADMIN_SIGNUP_KEY=...                     # any long random string you choose
```

### Two manual dashboard steps (can't be done via SQL)

1. **Email OTP code, not a link.** The signup wizard asks the student to type a
   6-digit code, so in **Supabase Dashboard → Authentication → Email Templates →
   Confirm signup**, make sure the template uses `{{ .Token }}` (the code) rather
   than `{{ .ConfirmationURL }}` (a magic link).
2. **An SMS provider for the +213 phone step.** Supabase doesn't send SMS itself —
   in **Authentication → Providers → Phone**, enable a provider (Twilio, Vonage, or
   MessageBird all work) and add its credentials. Without this, phone OTP codes
   won't actually be delivered, though the rest of the app works fine.

### Run it

```bash
npm run dev
```

Visit `http://localhost:3000` — you'll land on `/fr` (or `/ar` depending on your
browser's language).

---

## 3. How the Admin Key works

Anyone who knows `ADMIN_SIGNUP_KEY` can register as an admin at `/fr/admin-register`.
The key is checked server-side only (`app/[locale]/(auth)/admin-register/actions.ts`)
and is never sent to the browser. Treat it like a password — share it only with
people who should administer the platform, and rotate it in `.env.local` (and
wherever you deploy) if it ever leaks.

---

## 4. Project structure

```
app/[locale]/                  fr / ar routes (locale-prefixed throughout)
  (auth)/login, signup, admin-register
  (student)/dashboard/         home, catalogue, borrow-book, notebook-bundle,
                                requests (+ tracker), podcasts, settings, donate
  (admin)/admin/                overview, registrations, requests (verification
                                hub), inventory, podcasts
components/ui/                  design-system primitives (Button, Input, Modal…)
components/layout/               SplashScreen, Sidebar, AdminSidebar, Topbar
lib/supabase/                    browser / server / admin (service-role) clients
lib/i18n/                        fr.ts / ar.ts dictionaries + locale config
supabase/migration.sql           the additive migration (already applied)
```

Status pipeline used throughout (richer than a simple 4-state flow, matching what
was already wired into `book_requests`'s triggers):

```
pending → under_review → verified → approved → shipped → disbursed
                ↘             ↘          ↘
                              rejected (terminal, any stage)
```

Book loans are strictly 15 days: `expires_at` is set automatically by a database
trigger the moment a `book`-type request's status becomes `disbursed`.

---

## 5. Deploying

Any Next.js host works (Vercel, etc.). Set the same environment variables there.
Nothing in this app needs a Node server beyond what Next.js itself provides —
Server Actions handle all mutations.
