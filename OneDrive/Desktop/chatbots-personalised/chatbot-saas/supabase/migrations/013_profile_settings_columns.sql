-- ==============================================
-- Add settings columns to profiles table
-- ==============================================

-- Timezone preference
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT;

-- Notification preferences (JSON)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"newLead": true, "newConversation": false, "usageAlert": true, "weeklyDigest": false}'::jsonb;
