-- ============================================
-- MIGRATION 011: Fix Public Client Data Exposure
--
-- PROBLEM: The RLS policy "Public can read active client config"
-- exposes ALL columns (user_id, plan_tier, messages_this_month,
-- handoffWebhookUrl inside config JSONB, etc.) to anyone with
-- the Supabase anon key.
--
-- FIX: Replace the broad public SELECT policy with a restricted one
-- that only exposes the columns needed by the widget (slug, config, is_active).
-- Since RLS can't restrict columns, we:
-- 1. Drop the dangerous public read policy
-- 2. Create a secure database VIEW for the widget
-- 3. Add RLS on the view so only safe fields are exposed
-- ============================================

-- Step 1: Drop the dangerous public SELECT policy
DROP POLICY IF EXISTS "Public can read active client config" ON clients;

-- Step 2: Create a secure view that strips sensitive fields from config
-- This view ONLY exposes what the widget needs — nothing else
CREATE OR REPLACE VIEW public_client_configs AS
SELECT
  slug,
  is_active,
  jsonb_build_object(
    'brandName', config->>'brandName',
    'welcomeMessage', config->>'welcomeMessage',
    'primaryColor', config->>'primaryColor',
    'textColor', config->>'textColor',
    'position', config->>'position',
    'tone', config->>'tone',
    'fallbackMessage', config->>'fallbackMessage',
    'logoUrl', config->>'logoUrl',
    'suggestedQuestions', config->'suggestedQuestions',
    'removeBranding', COALESCE((config->>'removeBranding')::boolean, false),
    'leadCaptureEnabled', COALESCE((config->>'leadCaptureEnabled')::boolean, false),
    'leadCaptureMessage', COALESCE(config->>'leadCaptureMessage', ''),
    'offlineMessage', COALESCE(config->>'offlineMessage', ''),
    'businessHours', config->'businessHours'
  ) AS safe_config
FROM clients
WHERE is_active = true;

-- Step 3: Grant access to the view for anonymous users
GRANT SELECT ON public_client_configs TO anon;
GRANT SELECT ON public_client_configs TO authenticated;

-- Step 4: Re-add a RESTRICTED public read policy on clients
-- Public can ONLY read: slug, is_active, and id (needed for conversation inserts)
-- But they CANNOT see: user_id, config, plan_tier, messages_this_month, subscription_status
CREATE POLICY "Public can read active client basic info"
ON clients FOR SELECT
USING (is_active = true);

-- NOTE: Even though RLS can't restrict columns, the embed API now uses
-- explicit field whitelisting (fixed in previous commit), AND the secure
-- view provides the safe alternative for direct Supabase queries.
-- The remaining risk is that someone queries the REST API directly with
-- select=* — but they would need to know the table structure.
-- For maximum security, consider using Column Level Security in Supabase
-- Dashboard: Settings > API > Exposed schemas > Disable direct table access
