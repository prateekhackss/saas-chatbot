-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- CLIENTS TABLE (each client = one chatbot)
-- ============================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  name TEXT NOT NULL,                    -- "Sarah's Fitness Coaching"
  slug TEXT UNIQUE NOT NULL,             -- "sarah-fitness" (used in URLs + embed)
  
  -- Branding config
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  /*
    config structure:
    {
      "brandName": "Sarah's Fitness",
      "welcomeMessage": "Hi! Ask me anything about our programs!",
      "primaryColor": "#FF6B35",
      "textColor": "#FFFFFF",
      "position": "bottom-right",
      "tone": "friendly and encouraging",
      "fallbackMessage": "Great question! Email sarah@email.com for more details.",
      "logoUrl": "https://...",
      "suggestedQuestions": [
        "What programs do you offer?",
        "How much does coaching cost?",
        "Can I get a refund?"
      ]
    }
  */
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DOCUMENTS TABLE (source content per client)
-- ============================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,                   -- "FAQ", "Product Catalog", "Policies"
  content TEXT NOT NULL,                 -- Raw text content
  doc_type TEXT DEFAULT 'general',       -- 'faq', 'product', 'policy', 'about', 'general'
  
  -- Metadata
  char_count INTEGER GENERATED ALWAYS AS (length(content)) STORED,
  chunk_count INTEGER DEFAULT 0,         -- Updated after chunking
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by client
CREATE INDEX idx_documents_client ON documents(client_id);

-- ============================================
-- DOCUMENT CHUNKS TABLE (for RAG — the core)
-- ============================================
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,                 -- The chunk text (~500 tokens)
  embedding VECTOR(768),                -- Jina AI embedding (768 dimensions)
  
  -- Chunk metadata
  chunk_index INTEGER NOT NULL,          -- Position in original document
  metadata JSONB DEFAULT '{}'::jsonb,    -- { "doc_title": "FAQ", "doc_type": "faq" }
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRITICAL: Vector similarity search index
-- Using IVFFlat for good performance with moderate data
CREATE INDEX idx_chunks_embedding ON document_chunks 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Index for filtering by client during search
CREATE INDEX idx_chunks_client ON document_chunks(client_id);

-- ============================================
-- CONVERSATIONS TABLE (chat history + analytics)
-- ============================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  session_id TEXT NOT NULL,              -- Browser session ID
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  /*
    messages structure:
    [
      { "role": "user", "content": "How much is the course?", "timestamp": "..." },
      { "role": "assistant", "content": "Our course is priced at...", "timestamp": "..." }
    ]
  */
  
  -- Analytics
  message_count INTEGER DEFAULT 0,
  resolved BOOLEAN DEFAULT false,        -- Did the AI answer or fallback?
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_client ON conversations(client_id);
CREATE INDEX idx_conversations_session ON conversations(session_id);

-- ============================================
-- HELPER FUNCTION: Similarity search
-- ============================================
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding VECTOR(768),
  match_client_id UUID,
  match_count INT DEFAULT 5,
  match_threshold FLOAT DEFAULT 0.3
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE dc.client_id = match_client_id
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================
-- ROW LEVEL SECURITY (protect data)
-- ============================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Public can read client config (for widget)
CREATE POLICY "Public can read active client config"
  ON clients FOR SELECT
  USING (is_active = true);

-- Public can insert conversations (widget creates chats)
CREATE POLICY "Public can insert conversations"
  ON conversations FOR INSERT
  WITH CHECK (true);

-- Authenticated (you) can do everything
CREATE POLICY "Admin full access to clients"
  ON clients FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access to documents"
  ON documents FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access to chunks"
  ON document_chunks FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access to conversations"
  ON conversations FOR ALL
  USING (auth.role() = 'authenticated');
