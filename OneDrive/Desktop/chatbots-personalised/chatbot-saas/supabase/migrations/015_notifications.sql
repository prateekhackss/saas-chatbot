-- Migration: In-app notifications system
-- Stores alerts for lead captures, new conversations, usage warnings, etc.

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'lead_captured', 'new_conversation', 'usage_warning', 'weekly_digest'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY notifications_update ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY notifications_delete ON notifications FOR DELETE USING (auth.uid() = user_id);
