-- ============================================
-- MIGRATION 006: Admin Roles + Data Isolation Fix
-- 
-- This migration ensures:
-- 1. clients table has user_id column (may already exist from 002)
-- 2. profiles table has a role column (admin vs user)
-- 3. RLS policies are correct with admin bypass
-- 4. Your admin account is marked as admin
-- ============================================

-- ============================================
-- STEP 1: Ensure user_id column exists on clients
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE clients ADD COLUMN user_id UUID REFERENCES auth.users(id);
    CREATE INDEX idx_clients_user ON clients(user_id);
  END IF;
END $$;

-- Backfill orphaned clients → assign to the first user
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    SELECT id INTO first_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
    IF first_user_id IS NOT NULL THEN
        UPDATE clients SET user_id = first_user_id WHERE user_id IS NULL;
    END IF;
END $$;

-- Remove any clients without a user (safety net)
DELETE FROM clients WHERE user_id IS NULL;

-- Make user_id NOT NULL going forward
DO $$
BEGIN
  BEGIN
    ALTER TABLE clients ALTER COLUMN user_id SET NOT NULL;
  EXCEPTION WHEN others THEN
    NULL; -- already NOT NULL
  END;
END $$;

-- ============================================
-- STEP 2: Add role column to profiles
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'user';
  END IF;
END $$;

-- ============================================
-- STEP 3: Set your admin account
-- Change this email if your admin email is different
-- ============================================
UPDATE profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'prateekpatel712@gmail.com');

-- ============================================
-- STEP 4: Create helper function to check admin status
-- ============================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- STEP 5: Fix RLS policies with admin bypass
-- ============================================

-- CLIENTS: Users see own, admins see all
DROP POLICY IF EXISTS "Admin full access to clients" ON clients;
DROP POLICY IF EXISTS "Users manage own clients" ON clients;
CREATE POLICY "Users manage own clients" ON clients FOR ALL
  USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

-- Keep public read for widget
DROP POLICY IF EXISTS "Public can read active client config" ON clients;
CREATE POLICY "Public can read active client config" ON clients FOR SELECT
  USING (is_active = true);

-- DOCUMENTS: Users see own clients' docs, admins see all
DROP POLICY IF EXISTS "Admin full access to documents" ON documents;
DROP POLICY IF EXISTS "Users manage own documents" ON documents;
CREATE POLICY "Users manage own documents" ON documents FOR ALL
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    OR is_admin()
  )
  WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    OR is_admin()
  );

-- CHUNKS: Users see own clients' chunks, admins see all
DROP POLICY IF EXISTS "Admin full access to chunks" ON document_chunks;
DROP POLICY IF EXISTS "Users manage own chunks" ON document_chunks;
CREATE POLICY "Users manage own chunks" ON document_chunks FOR ALL
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    OR is_admin()
  )
  WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    OR is_admin()
  );

-- CONVERSATIONS: Users see own clients' convos, admins see all
DROP POLICY IF EXISTS "Admin full access to conversations" ON conversations;
DROP POLICY IF EXISTS "Users manage own conversations" ON conversations;
CREATE POLICY "Users manage own conversations" ON conversations FOR ALL
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    OR is_admin()
  )
  WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    OR is_admin()
  );

-- Keep public insert for widget (chatbot creates conversations)
DROP POLICY IF EXISTS "Public can insert conversations" ON conversations;
CREATE POLICY "Public can insert conversations" ON conversations FOR INSERT
  WITH CHECK (true);

-- PROFILES: Users see own profile, admins see all
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admin full access to profiles" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT
  USING (auth.uid() = id OR is_admin());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE
  USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Unique index for conversation sessions (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_session_unique ON conversations(session_id);
