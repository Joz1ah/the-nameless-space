-- ============================================================
-- THE NAMELESS SPACE — Supabase Setup (clean version)
-- Paste this into Supabase SQL Editor and run it.
-- ============================================================

-- ── 1. Tables ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  nickname      TEXT,
  slug          TEXT UNIQUE,
  bio           TEXT,
  avatar_url    TEXT,
  email_contact TEXT,
  website       TEXT,
  instagram     TEXT,
  twitter       TEXT,
  qr_url        TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT,
  body        TEXT NOT NULL DEFAULT '',
  is_draft    BOOLEAN NOT NULL DEFAULT false,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  is_locked   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entry_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id    UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  caption     TEXT,
  position    INTEGER DEFAULT 0,
  is_highlight BOOLEAN DEFAULT false,
  inline_key  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. Indexes ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS entries_user_id_idx  ON entries(user_id);
CREATE INDEX IF NOT EXISTS profiles_slug_idx    ON profiles(slug);
CREATE INDEX IF NOT EXISTS photos_entry_id_idx  ON entry_photos(entry_id);

-- ── 3. RLS ─────────────────────────────────────────────────

ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_photos ENABLE ROW LEVEL SECURITY;

-- drop old policies so this file is re-runnable
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies
           WHERE tablename IN ('profiles','entries','entry_photos')
           AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- profiles
CREATE POLICY "profiles_owner" ON profiles FOR ALL TO authenticated
  USING     (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_public_read" ON profiles FOR SELECT TO anon, authenticated
  USING (true);

-- entries
CREATE POLICY "entries_owner" ON entries FOR ALL TO authenticated
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "entries_public_read" ON entries FOR SELECT TO anon
  USING (is_draft = false AND is_locked = false);

-- entry_photos
CREATE POLICY "photos_owner" ON entry_photos FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM entries e WHERE e.id = entry_photos.entry_id AND e.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM entries e WHERE e.id = entry_photos.entry_id AND e.user_id = auth.uid())
  );

CREATE POLICY "photos_public_read" ON entry_photos FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM entries e
      WHERE e.id = entry_photos.entry_id
        AND e.is_draft  = false
        AND e.is_locked = false
    )
  );

-- ── 4. Storage bucket policies ─────────────────────────────
-- NOTE: Create the 'photos' and 'avatars' buckets manually in
--       Supabase Dashboard > Storage FIRST, then run this block.

DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
           WHERE tablename = 'objects' AND schemaname = 'storage'
             AND policyname IN (
               'photos_insert','photos_select','photos_delete',
               'avatars_insert','avatars_select','avatars_delete'
             )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "photos_insert" ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'photos');
CREATE POLICY "photos_select" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'photos');
CREATE POLICY "photos_delete" ON storage.objects FOR DELETE TO anon, authenticated
  USING (bucket_id = 'photos');

CREATE POLICY "avatars_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "avatars_select" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'avatars');
CREATE POLICY "avatars_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars');

-- ── 5. Auto-create profile on signup ───────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email_contact)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
