-- Add token estimation column
ALTER TABLE conversations ADD COLUMN estimated_tokens INTEGER DEFAULT 0;

-- Optional: Add index if we plan to sort/filter by heavy token usage later
CREATE INDEX idx_conversations_tokens ON conversations(estimated_tokens);
