import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

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
    suggestedQuestions: z.array(z.string())
  })
});

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    
    // 1. Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate payload
    const body = await req.json();
    const result = clientSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: result.error.errors }, 
        { status: 400 }
      );
    }

    const { name, slug, config } = result.data;

    // 3. Insert into Supabase
    // We use the server client here because RLS will allow "authenticated" users (Admin) to insert
    const { data, error } = await supabase
      .from('clients')
      .insert({
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
      return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Client created successfully', id: data.id }, { status: 201 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    
    // 1. Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch all clients
    const { data, error } = await supabase
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
