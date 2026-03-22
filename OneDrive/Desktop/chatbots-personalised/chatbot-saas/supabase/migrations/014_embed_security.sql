-- Migration: Add embed security (token + allowed origins)
-- Prevents unauthorized usage of embed codes on unknown domains

-- 1. Add embed_token column — a cryptographic secret that must accompany every embed request
ALTER TABLE clients ADD COLUMN IF NOT EXISTS embed_token TEXT;

-- 2. Add allowed_origins column — list of domains authorized to load the widget
ALTER TABLE clients ADD COLUMN IF NOT EXISTS allowed_origins TEXT[] DEFAULT '{}';

-- 3. Generate embed tokens for all existing clients that don't have one
UPDATE clients
SET embed_token = encode(gen_random_bytes(24), 'hex')
WHERE embed_token IS NULL;

-- 4. Make embed_token NOT NULL going forward
ALTER TABLE clients ALTER COLUMN embed_token SET NOT NULL;
ALTER TABLE clients ALTER COLUMN embed_token SET DEFAULT encode(gen_random_bytes(24), 'hex');

-- 5. Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_clients_embed_token ON clients(embed_token);

-- 6. Update the public_client_configs view to include allowed_origins (but NOT embed_token)
-- The embed_token is validated server-side only and never exposed in public views
CREATE OR REPLACE VIEW public_client_configs AS
SELECT
  id,
  slug,
  is_active,
  allowed_origins,
  config - 'handoffWebhookUrl' AS safe_config
FROM clients;
