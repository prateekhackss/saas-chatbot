import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Opt out of caching; we need real-time config in case the client updates their branding
export const dynamic = 'force-dynamic';

// Lightweight In-Memory Rate Limiter
// WARNING: does NOT persist across serverless invocations — for production at scale, use Upstash Redis
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

    if (!slug || slug.length > 100 || !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Use admin client to fetch embed_token (needed for widget auth)
    // The embed_token is passed to the widget so it can authenticate chat requests
    const adminDb = createAdminClient() as any;

    const { data: client, error } = await adminDb
      .from('clients')
      .select('config, is_active, embed_token, allowed_origins')
      .eq('slug', slug)
      .single();

    if (error || !client || !client.is_active) {
      return NextResponse.json(
        { error: 'Client not found or inactive' },
        { status: 404 }
      );
    }

    // SECURITY: Validate origin if allowed_origins is configured
    const allowedOrigins: string[] = client.allowed_origins || [];
    if (allowedOrigins.length > 0) {
      const requestOrigin = req.headers.get('origin') || req.headers.get('referer') || '';
      const originHostname = extractHostname(requestOrigin);
      const appHostname = extractHostname(process.env.NEXT_PUBLIC_APP_URL || 'localhost');

      // Always allow requests from the app itself (for preview/dashboard)
      const isAppOrigin = originHostname === appHostname || originHostname === 'localhost';

      if (!isAppOrigin) {
        const isAllowedOrigin = allowedOrigins.some(allowed => {
          const allowedHostname = extractHostname(allowed);
          if (allowedHostname.startsWith('*.')) {
            const baseDomain = allowedHostname.slice(2);
            return originHostname === baseDomain || originHostname.endsWith('.' + baseDomain);
          }
          return originHostname === allowedHostname;
        });

        if (!isAllowedOrigin) {
          return NextResponse.json({ error: 'Origin not authorized' }, { status: 403 });
        }
      }
    }

    // Build safe config — strip sensitive fields
    const safeConfig = {
      brandName: client.config.brandName,
      welcomeMessage: client.config.welcomeMessage,
      primaryColor: client.config.primaryColor,
      textColor: client.config.textColor,
      position: client.config.position,
      tone: client.config.tone,
      fallbackMessage: client.config.fallbackMessage,
      logoUrl: client.config.logoUrl,
      suggestedQuestions: client.config.suggestedQuestions,
      removeBranding: client.config.removeBranding || false,
      leadCaptureEnabled: client.config.leadCaptureEnabled || false,
      leadCaptureMessage: client.config.leadCaptureMessage || '',
      offlineMessage: client.config.offlineMessage || '',
      businessHours: client.config.businessHours || null,
    };

    // Return config + embed_token (token is needed by the widget to authenticate chat requests)
    // The token is NOT a secret that needs hiding — it's like an API key scoped to this client
    // It prevents slug-guessing attacks: knowing a slug alone is not enough to use the chatbot
    return NextResponse.json({
      config: safeConfig,
      embedToken: client.embed_token,
    }, { status: 200 });

  } catch (error) {
    console.error('Embed API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Extract hostname from a URL string (handles full URLs, origins, and bare domains).
 */
function extractHostname(urlOrOrigin: string): string {
  try {
    const normalized = urlOrOrigin.includes('://') ? urlOrOrigin : `https://${urlOrOrigin}`;
    return new URL(normalized).hostname.toLowerCase();
  } catch {
    return urlOrOrigin.toLowerCase().replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
  }
}
