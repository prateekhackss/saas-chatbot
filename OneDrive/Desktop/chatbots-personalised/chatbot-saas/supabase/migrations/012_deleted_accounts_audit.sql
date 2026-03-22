-- ============================================================
-- Migration 012: Deleted Accounts Audit Table
-- ============================================================
-- Stores a permanent record of every account deletion.
-- Admin can always see who deleted, when, and what they had.
-- Actual user data is wiped (GDPR), but the audit trail remains.
-- ============================================================

CREATE TABLE IF NOT EXISTS deleted_accounts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who was deleted
  user_id       UUID NOT NULL,
  email         TEXT NOT NULL,
  full_name     TEXT,
  role          TEXT DEFAULT 'user',

  -- What they had (snapshot at deletion time)
  plan_tier     TEXT,
  total_clients INTEGER DEFAULT 0,
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_leads   INTEGER DEFAULT 0,
  total_documents INTEGER DEFAULT 0,

  -- Subscription info
  subscription_status TEXT,
  lemon_subscription_id TEXT,

  -- Deletion metadata
  deletion_reason TEXT DEFAULT 'user_requested',
  deleted_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only admins can read this table — no public access, no regular users
ALTER TABLE deleted_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read deleted accounts"
  ON deleted_accounts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Service role (API routes) can insert records
-- No UPDATE or DELETE policies — audit records are immutable
