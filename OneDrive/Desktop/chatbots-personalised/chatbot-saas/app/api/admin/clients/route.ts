import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { PLAN_LIMITS, PlanTier } from '@/lib/constants/pricing';

export const dynamic = 'force-dynamic';

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  config: z.object({
    brandName: z.string(),
    welcomeMessage: z.string(),
    primaryColor: z.string(),
    textColor: z.string(),
    position: z.enum(['bottom-right', 'bottom-left']).default('bottom-right'),
    tone: z.string(),
    fallbackMessage: z.string(),
    logoUrl: z.string().url().optional().or(z.literal('')),
    suggestedQuestions: z.array(z.string()),
    allowedOrigins: z.array(z.string()).optional(),
    leadCaptureEnabled: z.boolean().optional(),
    leadCaptureMessage: z.string().optional(),
    handoffWebhookUrl: z.string().url().optional().or(z.literal('')),
    offlineMessage: z.string().optional(),
    businessHours: z.object({
      enabled: z.boolean(),
      timezone: z.string(),
      schedule: z.record(z.string(), z.object({
        start: z.string(),
        end: z.string()
      }).nullable())
    }).optional()
  })
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const db = supabase as any;
    
    // 1. Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check if user is admin — admins bypass all gates
    const { data: profile } = await db
      .from('profiles')
      .select('role, subscription_status, plan_tier')
      .eq('id', user.id)
      .maybeSingle();
    const isAdmin = profile?.role === 'admin';

    // 3. Check user-level subscription for non-admin users
    if (!isAdmin) {
      const hasActiveSub = ['active', 'trialing', 'past_due'].includes(
        profile?.subscription_status || ''
      );

      if (!hasActiveSub) {
        return NextResponse.json(
          { error: 'Active subscription required. Please subscribe to a plan first.' },
          { status: 403 }
        );
      }

      // 4. Enforce bot count limit based on plan
      const planTier = (profile?.plan_tier || 'starter') as PlanTier;
      const maxBots = PLAN_LIMITS[planTier].maxBots;

      const { count: currentBotCount } = await db
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_active', true);

      if ((currentBotCount || 0) >= maxBots) {
        return NextResponse.json(
          { error: `Bot limit reached. Your ${planTier} plan allows ${maxBots} bot(s). Upgrade to create more.` },
          { status: 403 }
        );
      }
    }

    // 3. Parse and validate payload
    const body = await req.json();
    const result = clientSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: result.error.issues }, 
        { status: 400 }
      );
    }

    const { name, slug, config } = result.data;

    // 3. Insert into Supabase
    // We use the server client here because RLS will allow "authenticated" users (Admin) to insert
    const { data, error } = await db
      .from('clients')
      .insert({
        user_id: user.id,
        name,
        slug,
        config: config as any // Cast for TS compilation
      })
      .select('id')
      .single();

    if (error) {
      if (error.code === '23505') { // Postgres unique constraint violation
        return NextResponse.json({ error: 'Client slug already exists' }, { status: 409 });
      }
      console.error('Database error:', error);
      return NextResponse.json({ error: `Failed: ${error.message} ${error.details || ''}` }, { status: 500 });
    }

    return NextResponse.json({ message: 'Client created successfully', id: data.id }, { status: 201 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const db = supabase as any;
    
    // 1. Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch all clients
    const { data, error } = await db
      .from('clients')
      .select('id, name, slug, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }

    return NextResponse.json({ clients: data });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
