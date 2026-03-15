import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRelevantContext, buildSystemPrompt } from '@/lib/ai/rag';
import { streamChatResponse, type ChatHistoryMessage } from '@/lib/ai/groq';
import { ClientConfig } from '@/types/database';

// Opt out of caching; this must be dynamic for real-time chat
export const dynamic = 'force-dynamic';

// Lightweight In-Memory Rate Limiter (Note: In a multi-region Edge deployment, using Redis/Upstash is preferred)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT = 20; // max requests per window
const WINDOW_MS = 60 * 1000; // 1 minute window

export async function POST(req: NextRequest) {
  try {
    // 1. Basic Rate Limiting Check
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const now = Date.now();
    const windowStart = now - WINDOW_MS;
    
    if (Math.random() < 0.05) {
       for (const [key, value] of Array.from(rateLimitMap.entries())) {
          if (value.lastReset < windowStart) rateLimitMap.delete(key);
       }
    }

    const rateData = rateLimitMap.get(ip) || { count: 0, lastReset: now };
    
    if (rateData.lastReset < windowStart) {
       rateData.count = 1;
       rateData.lastReset = now;
    } else {
       rateData.count++;
    }
    
    rateLimitMap.set(ip, rateData);

    if (rateData.count > RATE_LIMIT) {
       return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
    }

    const body = await req.json();
    const { clientSlug, sessionId, history, message, messages } = body;
    const normalizedSdkMessages = normalizeMessages(messages);
    const normalizedHistory = normalizeMessages(history);

    let latestUserMessage =
      typeof message === 'string' && message.trim().length > 0
        ? message.trim()
        : '';
    let safeHistory: ChatHistoryMessage[] = normalizedHistory;

    if (!latestUserMessage && normalizedSdkMessages.length > 0) {
      const lastMessage = normalizedSdkMessages[normalizedSdkMessages.length - 1];

      if (lastMessage.role === 'user') {
        latestUserMessage = lastMessage.content;
        safeHistory = normalizedSdkMessages.slice(0, -1);
      } else {
        safeHistory = normalizedSdkMessages;
      }
    }

    if (!clientSlug || !sessionId || !latestUserMessage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // We use the admin client because the public widget doesn't have RLS read access
    // to the sensitive `clients` config or `document_chunks`. We act as a trusted middleman.
    const supabase = createAdminClient();

    // 1. Validate Client & Get Config
    const { data: rawClient, error: clientError } = await supabase
      .from('clients')
      .select('id, config, is_active')
      .eq('slug', clientSlug)
      .single();

    const client = rawClient as any;

    if (clientError || !client || !client.is_active) {
      return NextResponse.json({ error: 'Client not found or inactive' }, { status: 404 });
    }

    const clientId = client.id;
    const clientConfig = client.config as ClientConfig;

    // 2. RAG Phase 1: Retrieval
    // Get the most relevant chunks based on the user's current message
    const relevantChunks = await getRelevantContext(clientId, latestUserMessage);

    // 3. RAG Phase 2: Augmentation
    // Build the strict instructional prompt with the injected chunks
    const systemPrompt = buildSystemPrompt(clientConfig, relevantChunks);

    // 4. Record the user's message asynchronously to prevent blocking the stream
    // We update the JSONB 'messages' array and increment the count
    const newMessages = [
      ...safeHistory,
      { role: 'user', content: latestUserMessage, timestamp: new Date().toISOString() }
    ];

    saveConversationAsync(supabase, clientId, sessionId, newMessages);

    // 5. RAG Phase 3: Generation (Streaming)
    // Send to Groq Llama 3.3 and immediately stream the response back
    const result = await streamChatResponse(systemPrompt, safeHistory, latestUserMessage, async (text: string) => {
        // onFinish handler
        const finalMessages = [
           ...newMessages,
           { role: 'assistant', content: text, timestamp: new Date().toISOString() }
        ];
        await saveConversationAsync(supabase, clientId, sessionId, finalMessages);
    });

    // The Vercel AI SDK provides `toDataStreamResponse()` which easily hooks into Next.js App Router
    return (result as any).toDataStreamResponse();

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function normalizeMessages(input: unknown): ChatHistoryMessage[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const role = 'role' in entry ? entry.role : undefined;
      const content = 'content' in entry ? entry.content : undefined;

      if (
        (role === 'user' || role === 'assistant' || role === 'system') &&
        typeof content === 'string' &&
        content.trim().length > 0
      ) {
        return {
          role,
          content: content.trim(),
        };
      }

      return null;
    })
    .filter((entry): entry is ChatHistoryMessage => entry !== null);
}

/**
 * Helper to synchronously kick off an async DB update.
 * We "upsert" based on sessionId. If it's a new session, it creates a new chat history.
 * If the session exists, it appends the messages object.
 */
async function saveConversationAsync(supabase: any, clientId: string, sessionId: string, messages: any[]) {
  // We use standard Postgres upsert. Since `session_id` is indexed, we could theoretically use it, 
  // but let's query first to see if it exists since we didn't add a UNIQUE constraint to session_id 
  // (a single user might have multiple sessions over time, but for active chat we'll match on the most recent active session)
  
  // Actually, standard behavior for this schema: Find the existing session, or create it.
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('session_id', sessionId)
    .single();

  if (existing) {
    await supabase
      .from('conversations')
      .update({ 
        messages: messages,
        message_count: messages.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('conversations')
      .insert({
        client_id: clientId,
        session_id: sessionId,
        messages: messages,
        message_count: messages.length
      });
  }
}
