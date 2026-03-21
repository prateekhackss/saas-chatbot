-- ============================================
-- ADD BILLING FIELDS TO CLIENTS (Part 6 Implementation)
-- ============================================

-- Add plan_tier with default 'starter'. Trial accounts can be set to 'pro' logic later.
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'starter' CHECK (plan_tier IN ('starter', 'pro', 'business'));

-- Add usage tracking
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS messages_this_month INTEGER DEFAULT 0;

-- RPC to atomically increment usage counter
CREATE OR REPLACE FUNCTION increment_client_messages(target_client_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE clients
  SET messages_this_month = COALESCE(messages_this_month, 0) + 1
  WHERE id = target_client_id;
END;
$$;
