import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const leadSchema = z.object({
  clientSlug: z.string().min(1),
  sessionId: z.string().min(1),
  name: z.string().optional(),
  email: z.string().email('Invalid email address'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = leadSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid data', details: result.error.issues }, { status: 400 });
    }
    
    const { clientSlug, sessionId, name, email } = result.data;
    const supabase = createAdminClient();
    
    // Get client ID from slug
    const { data: client } = await (supabase as any)
      .from('clients')
      .select('id, is_active')
      .eq('slug', clientSlug)
      .eq('is_active', true)
      .maybeSingle();
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    // Upsert lead (don't create duplicate for same email + client)
    const { error } = await (supabase as any)
      .from('leads')
      .upsert({
        client_id: client.id,
        session_id: sessionId,
        name: name || null,
        email,
        captured_at: new Date().toISOString(),
      }, { 
        onConflict: 'client_id,email',
        ignoreDuplicates: false // update session_id and name if they submit again
      });
    
    if (error) {
      console.error('Lead capture error:', error);
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Thank you!' }, { status: 201 });
  } catch (error) {
    console.error('Lead API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
