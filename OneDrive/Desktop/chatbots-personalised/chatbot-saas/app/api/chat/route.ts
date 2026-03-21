import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRelevantContext, buildSystemPrompt } from '@/lib/ai/rag';
import { embedText } from '@/lib/ai/embeddings';
import { streamChatResponse, type ChatHistoryMessage } from '@/lib/ai/groq';
import { ClientConfig } from '@/types/database';
import { PLAN_LIMITS, PlanTier } from '@/lib/constants/pricing';

// Opt out of caching; this must be dynamic for real-time chat
export const dynamic = 'force-dynamic';

// Compile to Vercel Edge Runtime to eliminate Node.js cold-start latency
export const runtime = 'edge';

// Rate Limiter: Two layers
// Layer 1: In-memory (catches bursts within same instance)
// Layer 2: Database-level message count (catches abuse across instances)
// For production at scale, replace with Upstash Redis:
// import { Ratelimit } from '@upstash/ratelimit'
// import { Redis } from '@upstash/redis'
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT = 10; // max requests per minute per IP (reduced from 20)
const WINDOW_MS = 60 * 1000; // 1 minute window
const SESSION_RATE_LIMIT = 30; // max messages per session per hour (DB-enforced)

function sanitizeUserInput(input: string): string {
  // Strip common injection patterns but keep the message readable
  return input
    .replace(/\b(ignore|forget|disregard)\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|rules)\b/gi, '[filtered]')
    .replace(/\b(you are now|act as|pretend to be|new instructions?:)\b/gi, '[filtered]')
    .replace(/\b(system\s*prompt|<\/?system>|<\/?prompt>)\b/gi, '[filtered]')
    .trim();
}

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

    const MAX_HISTORY_MESSAGES = 20;
    if (safeHistory.length > MAX_HISTORY_MESSAGES) {
      safeHistory = safeHistory.slice(-MAX_HISTORY_MESSAGES);
    }

    const MAX_MESSAGE_LENGTH = 2000; // ~500 tokens
    if (latestUserMessage.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: 'Message too long. Please keep it under 2000 characters.' }, { status: 400 });
    }

    latestUserMessage = sanitizeUserInput(latestUserMessage);

    if (!clientSlug || !sessionId || !latestUserMessage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // We use the admin client because the public widget doesn't have RLS read access
    // to the sensitive `clients` config or `document_chunks`. We act as a trusted middleman.
    const supabase = createAdminClient();

    // 0. Parallelize Network Requests
    // Immediately trigger the Jina Embeddings API network call so it calculates concurrently with the Database fetch
    const embeddingPromise = embedText(latestUserMessage).catch(err => {
      console.error("Embedding generation failed:", err);
      return null;
    });

    // 1. Validate Client & Get Config (Runs concurrently)
    const { data: rawClient, error: clientError } = await supabase
      .from('clients')
      .select('id, config, is_active, plan_tier, messages_this_month')
      .eq('slug', clientSlug)
      .single();

    const client = rawClient as any;

    if (clientError || !client || !client.is_active) {
      return NextResponse.json({ error: 'Client not found or inactive' }, { status: 404 });
    }

    const clientId = client.id;
    const clientConfig = client.config as ClientConfig;

    // 1.5a. Per-session rate limit (DB-enforced, survives cold starts)
    // Check if this session has sent too many messages in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: sessionConvo } = await supabase
      .from('conversations')
      .select('message_count, updated_at')
      .eq('session_id', sessionId)
      .single();

    if (sessionConvo) {
      const updatedAt = new Date(sessionConvo.updated_at).getTime();
      const isWithinHour = updatedAt > Date.now() - 60 * 60 * 1000;
      if (isWithinHour && sessionConvo.message_count > SESSION_RATE_LIMIT) {
        return NextResponse.json(
          { error: 'You are sending messages too quickly. Please wait a few minutes.' },
          { status: 429 }
        );
      }
    }

    // 1.5b. Validate Usage Limits (Part 6 Metering)
    const planTier = (client.plan_tier || 'starter') as PlanTier;
    const messagesUsed = client.messages_this_month || 0;
    const messageLimit = PLAN_LIMITS[planTier].maxMessages;

    if (messagesUsed >= messageLimit) {
      // Graceful degradation fallback if usage exceeds 100%
      // Returns a static plain text response that the `useChat` hook can read as a single chunk.
      return new NextResponse(
        "I'm currently unavailable. Please contact the team directly.",
        { status: 200 }
      );
    }

    // 2. RAG Phase 1: Retrieval
    // Wait for the embedding promise to finish before querying vectors
    const queryEmbedding = await embeddingPromise;
    if (!queryEmbedding) {
      return NextResponse.json({ error: 'Failed to generate query embeddings' }, { status: 500 });
    }

    const relevantChunks = await getRelevantContext(clientId, queryEmbedding);

    // 3. RAG Phase 2: Augmentation
    // Build the strict instructional prompt with the injected chunks
    const systemPrompt = buildSystemPrompt(clientConfig, relevantChunks);

    // 4. RAG Phase 3: Generation (Streaming)
    // Send to Groq Llama 3.3 and immediately stream the response back
    const result = await streamChatResponse(systemPrompt, safeHistory, latestUserMessage, async (text: string) => {
        // onFinish handler
        const needsHandoff = text.includes('[HANDOFF_NEEDED]');
        const cleanText = text.replace(/\[HANDOFF_NEEDED\]/g, '').trim();

        const finalMessages = [
           ...safeHistory,
           { role: 'user', content: latestUserMessage, timestamp: new Date().toISOString() },
           { role: 'assistant', content: cleanText, timestamp: new Date().toISOString() }
        ];
        
        // Rough estimation: 1 token ≈ 4 characters
        const estimatedTokens = Math.ceil((latestUserMessage.length + cleanText.length) / 4);
        
        // Pass the negated handoff flag to automatically resolve or block resolutions
        await saveConversationAsync(supabase, clientId, sessionId, finalMessages, !needsHandoff, estimatedTokens);

        // Fire and forget escalation hook
        if (needsHandoff && clientConfig.handoffWebhookUrl) {
           fireHandoffWebhook(clientConfig.handoffWebhookUrl, {
             clientSlug,
             sessionId,
             question: latestUserMessage,
             botResponse: cleanText,
             timestamp: new Date().toISOString(),
           }).catch(err => console.error('Webhook error:', err));
        }

        // Increment the usage tracking metrics safely
        // @ts-ignore - Supabase type-gen mismatch
        await supabase.rpc('increment_client_messages', { target_client_id: clientId });
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
async function saveConversationAsync(supabase: any, clientId: string, sessionId: string, messages: any[], resolved: boolean = true, newTokens: number = 0) {
  // To keep it simple and stateless during concurrent streams, we fetch current tokens, add newTokens, and upsert
  const { data: current } = await supabase
    .from('conversations')
    .select('estimated_tokens')
    .eq('session_id', sessionId)
    .maybeSingle();
    
  let totalTokens = newTokens;
  if (current && typeof current.estimated_tokens === 'number') {
    totalTokens += current.estimated_tokens;
  }

  const { error } = await supabase
    .from('conversations')
    .upsert({
      client_id: clientId,
      session_id: sessionId,
      messages: messages,
      message_count: messages.length,
      estimated_tokens: totalTokens,
      resolved: resolved,
      updated_at: new Date().toISOString()
    }, { 
      onConflict: 'session_id' 
    });
  
  if (error) {
    console.error('Failed to save conversation:', error);
  }
}

async function fireHandoffWebhook(url: string, payload: any) {
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
