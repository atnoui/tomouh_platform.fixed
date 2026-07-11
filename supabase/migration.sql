-- ============================================================================
-- TOMOUH PLATFORM — ADDITIVE MIGRATION
-- Project: tomouh_project (behftzxktknfkbqindck)
-- ============================================================================
-- This script was written after inspecting the LIVE schema of tomouh_project.
-- It only ADDS columns/tables/functions/policies. It never drops or rewrites
-- anything that already exists. It is fully idempotent — safe to run more
-- than once.
--
-- WHAT WE FOUND ALREADY LIVE (and therefore reused instead of duplicated):
--   public.profiles        -> the "Profiles/Users extensions" table from the
--                              brief (1:1 with auth.users, has full_name,
--                              email, phone, role user_role enum, wilaya)
--   public.book_requests    -> the "Orders" table from the brief. It already
--                              has request_number (format REQ-####-X, exactly
--                              matching the Figma "Request Status" screen),
--                              wilaya/commune/detailed_address/proof_of_need
--                              (matching the Figma "Application Form"),
--                              national_id_card_url + family_civil_status_
--                              card_url, request_type enum (book /
--                              notebook_bundle) and a rich status enum
--                              (pending/under_review/verified/approved/
--                              rejected/shipped/disbursed) — already wired to
--                              triggers that log history and create
--                              notifications. This is a much richer, already
--                              production-wired version of the "orders" table
--                              the brief asked for, so the app is built on
--                              top of it rather than creating a parallel
--                              "orders" table.
--   public.books             -> the "Inventory" table (title_ar/title_fr,
--                              subject, school_level, type book/
--                              notebook_bundle, condition, stock_quantity,
--                              pickup_location, wilaya_id, is_available)
--   public.request_status_history, public.notifications -> already wired via
--                              triggers on book_requests.
--   public.wilayas           -> already seeded with all 58 Algerian wilayas.
--   storage bucket "aid-documents" (private) -> already exists for ID/
--                              family-card uploads, just had no RLS
--                              policies yet.
--
--   NOTE: tomouh_project also contains a second, OLDER/PARALLEL set of
--   tables (public.users, public.aid_requests, public.registrations,
--   public.user_registrations, public.courses/videos/enrollments/
--   user_streaks). These look like an earlier scaffold for a generic
--   LMS + a duplicate request flow. We do NOT touch, drop, or build the
--   app against them, per your instruction not to disturb existing tables.
--   They are simply left inert. You may want to drop them later once you've
--   confirmed they're unused, but that is a separate, deliberate decision —
--   this migration does not do it.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. PROFILES: add the two columns the brief explicitly asks for
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS parent_phone text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_indigent boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.parent_phone IS 'Parent/guardian Algerian phone number, +213 format, captured at signup.';
COMMENT ON COLUMN public.profiles.is_indigent IS 'Set by an admin once a family civil-status card has been verified for a notebook-bundle request.';


-- ----------------------------------------------------------------------------
-- 2. BOOK_REQUESTS (= "Orders"): add the few columns missing vs. the brief
-- ----------------------------------------------------------------------------
ALTER TABLE public.book_requests
  ADD COLUMN IF NOT EXISTS book_id uuid REFERENCES public.books(id) ON DELETE SET NULL;

ALTER TABLE public.book_requests
  ADD COLUMN IF NOT EXISTS book_title text;

ALTER TABLE public.book_requests
  ADD COLUMN IF NOT EXISTS bundle_name text;

ALTER TABLE public.book_requests
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

COMMENT ON COLUMN public.book_requests.book_id IS 'Optional FK to the specific catalog item (public.books) being requested.';
COMMENT ON COLUMN public.book_requests.book_title IS 'Denormalized book title at time of request (request_type = book).';
COMMENT ON COLUMN public.book_requests.bundle_name IS 'Denormalized bundle name at time of request (request_type = notebook_bundle).';
COMMENT ON COLUMN public.book_requests.expires_at IS 'Loan due date. Books are loaned for strictly 15 days, set automatically when status becomes disbursed.';


-- ----------------------------------------------------------------------------
-- 3. 15-DAY BOOK LOAN EXPIRY — set automatically on disbursement
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_book_loan_expiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'disbursed'
     AND (OLD.status IS DISTINCT FROM 'disbursed')
     AND NEW.request_type = 'book' THEN
    NEW.expires_at := now() + interval '15 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_book_loan_expiry ON public.book_requests;
CREATE TRIGGER trg_set_book_loan_expiry
  BEFORE UPDATE ON public.book_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_book_loan_expiry();


-- ----------------------------------------------------------------------------
-- 4. PODCASTS — new table, exactly as specified in the brief
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.podcasts (
  id           uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  title        text NOT NULL,
  description  text,
  media_url    text NOT NULL,
  media_type   text NOT NULL DEFAULT 'audio' CHECK (media_type IN ('audio', 'video')),
  thumbnail_url text,
  is_published boolean NOT NULL DEFAULT true,
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.podcasts ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_podcasts_updated ON public.podcasts;
CREATE TRIGGER trg_podcasts_updated
  BEFORE UPDATE ON public.podcasts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP POLICY IF EXISTS "podcasts_select_published" ON public.podcasts;
CREATE POLICY "podcasts_select_published"
  ON public.podcasts FOR SELECT
  USING (is_published = true OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role
  ));

DROP POLICY IF EXISTS "podcasts_admin_all" ON public.podcasts;
CREATE POLICY "podcasts_admin_all"
  ON public.podcasts FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role
  ));


-- ----------------------------------------------------------------------------
-- 5. AUTO-CREATE A PROFILE ROW WHEN SOMEONE SIGNS UP
-- ----------------------------------------------------------------------------
-- There was no trigger on auth.users yet, so every new signup needs one to
-- get a public.profiles row (book_requests / notifications both assume one
-- exists for every authenticated user).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, parent_phone, wilaya, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone),
    NEW.raw_user_meta_data->>'parent_phone',
    NEW.raw_user_meta_data->>'wilaya',
    CASE
      WHEN (NEW.raw_user_meta_data->>'role') = 'admin' THEN 'admin'::user_role
      ELSE 'student'::user_role
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Keep profiles.phone in sync once a student verifies their phone via SMS OTP
-- (auth.updateUser({ phone }) + verifyOtp sets auth.users.phone_confirmed_at).
CREATE OR REPLACE FUNCTION public.handle_phone_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.phone_confirmed_at IS NOT NULL AND OLD.phone_confirmed_at IS NULL THEN
    UPDATE public.profiles SET phone = NEW.phone WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_phone_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_phone_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_phone_confirmed();


-- ----------------------------------------------------------------------------
-- 6. HELPER RPCs the frontend needs (kept as SECURITY DEFINER functions so
--    we never expose the auth schema directly through PostgREST)
-- ----------------------------------------------------------------------------

-- A signed-in user can check their own email/phone verification state
-- (needed to drive the signup wizard's OTP steps).
CREATE OR REPLACE FUNCTION public.get_my_verification_status()
RETURNS TABLE (email_confirmed boolean, phone_confirmed boolean, phone text, email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.email_confirmed_at IS NOT NULL,
    u.phone_confirmed_at IS NOT NULL,
    u.phone,
    u.email
  FROM auth.users u
  WHERE u.id = auth.uid();
$$;

-- Admin-only directory of every registered user, joined with verification
-- state from auth.users (needed for the "Registration Management" screen).
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  phone text,
  parent_phone text,
  role user_role,
  wilaya text,
  is_indigent boolean,
  is_active boolean,
  email_confirmed boolean,
  phone_confirmed boolean,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id, p.full_name, p.email, p.phone, p.parent_phone, p.role, p.wilaya,
    p.is_indigent, p.is_active,
    u.email_confirmed_at IS NOT NULL,
    u.phone_confirmed_at IS NOT NULL,
    p.created_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE EXISTS (
    SELECT 1 FROM public.profiles me WHERE me.id = auth.uid() AND me.role = 'admin'::user_role
  )
  ORDER BY p.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.admin_list_users() FROM public;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_verification_status() TO authenticated;


-- ----------------------------------------------------------------------------
-- 7. STORAGE POLICIES for the existing "aid-documents" bucket
--    (the bucket already existed with RLS on but zero policies, i.e. nobody
--    but the service role could read/write it — we add the missing rules)
-- ----------------------------------------------------------------------------
-- Expected upload path convention used by the app:
--   {user_id}/{request_id}/national-id.<ext>
--   {user_id}/{request_id}/family-card.<ext>
-- so the first path segment is always the owning user's auth uid.

DROP POLICY IF EXISTS "aid_documents_owner_insert" ON storage.objects;
CREATE POLICY "aid_documents_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'aid-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "aid_documents_owner_select" ON storage.objects;
CREATE POLICY "aid_documents_owner_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'aid-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role
      )
    )
  );

DROP POLICY IF EXISTS "aid_documents_admin_delete" ON storage.objects;
CREATE POLICY "aid_documents_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'aid-documents'
    AND EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role
    )
  );


-- ----------------------------------------------------------------------------
-- 8. PUBLIC MEDIA BUCKETS for book covers and podcast thumbnails/audio
--    (created only if they don't already exist; public read, admin write)
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('public-media', 'public-media', true, 52428800)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_media_read" ON storage.objects;
CREATE POLICY "public_media_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'public-media');

DROP POLICY IF EXISTS "public_media_admin_write" ON storage.objects;
CREATE POLICY "public_media_admin_write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'public-media'
    AND EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role
    )
  );

DROP POLICY IF EXISTS "public_media_admin_update" ON storage.objects;
CREATE POLICY "public_media_admin_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'public-media'
    AND EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role
    )
  );

DROP POLICY IF EXISTS "public_media_admin_delete" ON storage.objects;
CREATE POLICY "public_media_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'public-media'
    AND EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role
    )
  );


-- ----------------------------------------------------------------------------
-- 9. Allow admins to insert/update catalog items (books) — SELECT already
--    existed ("books_select" — available items only); INSERT/UPDATE/DELETE
--    for admins was missing.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "books_admin_all" ON public.books;
CREATE POLICY "books_admin_all"
  ON public.books FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role
  ));

-- Everyone signed in should be able to read wilayas for the dropdown
-- (existing RLS is enabled with no policy yet => currently unreadable by anon/authenticated).
DROP POLICY IF EXISTS "wilayas_select_all" ON public.wilayas;
CREATE POLICY "wilayas_select_all"
  ON public.wilayas FOR SELECT
  USING (true);

-- ----------------------------------------------------------------------------
-- 10. SECURITY HARDENING: the existing "Users can update their own profile"
--     policy is row-level only — it does not stop a student from sending
--     role/is_indigent/is_active in their own update payload via a raw API
--     call. Since this migration is the one introducing is_indigent (and the
--     app trusts role for admin routing), we close that gap with a trigger
--     rather than touching the existing policy.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_privileged_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role
  ) AND auth.role() <> 'service_role' THEN
    NEW.role := OLD.role;
    NEW.is_indigent := OLD.is_indigent;
    NEW.is_active := OLD.is_active;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_privileged_profile_fields ON public.profiles;
CREATE TRIGGER trg_protect_privileged_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_privileged_profile_fields();

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
