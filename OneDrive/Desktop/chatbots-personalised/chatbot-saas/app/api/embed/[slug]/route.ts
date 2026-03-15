import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Opt out of caching; we need real-time config in case the client updates their branding
export const dynamic = 'force-dynamic';

// Lightweight In-Memory Rate Limiter (Note: In a multi-region Edge deployment, using Redis/Upstash is preferred)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT = 50; // max config fetches per minute
const WINDOW_MS = 60 * 1000; // 1 minute window

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
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

    const { slug } = await params;
    
    if (!slug) {
      return NextResponse.json({ error: 'Missing client slug' }, { status: 400 });
    }

    // Use standard client. Our RLS policies allow public SELECT on active client configs.
    const supabase = await createClient();
    const db = supabase as any;

    const { data: client, error } = await db
      .from('clients')
      .select('config, is_active')
      .eq('slug', slug)
      .single();

    if (error || !client || !client.is_active) {
      return NextResponse.json(
        { error: 'Client not found or inactive' },
        { status: 404 }
      );
    }

    // Safely return only the public configuration rules
    // (We omit database IDs, secrets, etc.)
    return NextResponse.json({ config: client.config }, { status: 200 });
    
  } catch (error) {
    console.error('Embed API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
