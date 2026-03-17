-- Leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  name TEXT,
  email TEXT NOT NULL,
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_client ON leads(client_id);
CREATE INDEX idx_leads_email ON leads(client_id, email);
CREATE UNIQUE INDEX idx_leads_client_email ON leads(client_id, email);

-- RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Widget can insert leads
CREATE POLICY "Public can insert leads" ON leads FOR INSERT WITH CHECK (true);

-- Only owner can read leads
CREATE POLICY "Users read own leads" ON leads FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- Add lead capture config to clients
-- (Config is JSONB so no schema change needed, but document the new fields)

-- Add allowed_origins and office hours fields
COMMENT ON COLUMN clients.config IS 'JSONB config including: brandName, welcomeMessage, primaryColor, textColor, position, tone, fallbackMessage, logoUrl, suggestedQuestions, leadCaptureEnabled (bool), leadCaptureMessage (string), offlineMessage (string), businessHours ({enabled, timezone, schedule: {mon: {start, end}, ...}})';
