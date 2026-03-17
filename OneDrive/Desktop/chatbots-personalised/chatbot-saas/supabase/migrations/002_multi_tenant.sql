-- ============================================
-- MIGRATION 002: Multi-Tenant + Security Fixes
-- Run AFTER 001_initial.sql
-- ============================================

-- 1. Add user ownership to clients
ALTER TABLE clients ADD COLUMN user_id UUID REFERENCES auth.users(id);
CREATE INDEX idx_clients_user ON clients(user_id);

-- Backfill existing rows (assign to the first authenticated user)
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    SELECT id INTO first_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
    IF first_user_id IS NOT NULL THEN
        UPDATE clients SET user_id = first_user_id WHERE user_id IS NULL;
    END IF;
END $$;

-- Make it NOT NULL for new rows going forward
ALTER TABLE clients ALTER COLUMN user_id SET NOT NULL;


-- 2. Fix RLS policies for multi-tenant isolation

-- Clients: users manage only their own
DROP POLICY IF EXISTS "Admin full access to clients" ON clients;
CREATE POLICY "Users manage own clients" ON clients FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Keep: "Public can read active client config" (widget needs it)

-- Documents: only for own clients
DROP POLICY IF EXISTS "Admin full access to documents" ON documents;
CREATE POLICY "Users manage own documents" ON documents FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- Chunks: only for own clients
DROP POLICY IF EXISTS "Admin full access to chunks" ON document_chunks;
CREATE POLICY "Users manage own chunks" ON document_chunks FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- Conversations: only for own clients
DROP POLICY IF EXISTS "Admin full access to conversations" ON conversations;
CREATE POLICY "Users manage own conversations" ON conversations FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- Keep: "Public can insert conversations" (widget creates these)

-- Add unique constraint to prevent duplicate sessions
CREATE UNIQUE INDEX idx_conversations_session_unique ON conversations(session_id);
