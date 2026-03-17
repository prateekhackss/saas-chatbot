import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const db = supabase as any;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current state
    const { data: client, error: fetchError } = await db
      .from('clients')
      .select('id, is_active, name')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const newState = !client.is_active;

    const { error: updateError } = await db
      .from('clients')
      .update({ is_active: newState, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: `Client "${client.name}" ${newState ? 'activated' : 'deactivated'}`,
      is_active: newState 
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
