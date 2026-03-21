import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Sanitize CSV values to prevent formula injection attacks
function sanitizeCsvValue(value: string): string {
  if (!value) return '';
  // Prefix dangerous characters that could trigger Excel formula execution
  if (/^[=+\-@\t\r]/.test(value)) {
    return `'${value}`;
  }
  return value.replace(/"/g, '""');
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const db = supabase as any;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const format = searchParams.get('format') || 'json'; // json or csv

    const type = searchParams.get('type') || 'conversations'; // "conversations" | "leads"

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Verify client ownership (defense-in-depth alongside RLS)
    const { data: ownedClient, error: ownershipError } = await db
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (ownershipError || !ownedClient) {
      return NextResponse.json({ error: 'Client not found or access denied' }, { status: 403 });
    }

    if (type === 'leads') {
      const { data: leads, error } = await db
        .from('leads')
        .select('name, email, session_id, captured_at')
        .eq('client_id', clientId)
        .order('captured_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
      }

      if (format === 'csv') {
        const csvRows = ['Name,Email,Session ID,Captured At'];
        for (const lead of (leads || [])) {
          csvRows.push(`"${sanitizeCsvValue(lead.name || '')}","${sanitizeCsvValue(lead.email)}","${lead.session_id}","${lead.captured_at}"`);
        }
        return new NextResponse(csvRows.join('\n'), {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="leads-${clientId}.csv"`,
          },
        });
      }
      return NextResponse.json({ leads });
    }

    const { data: conversations, error } = await db
      .from('conversations')
      .select('session_id, messages, message_count, resolved, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    if (format === 'csv') {
      const csvRows = ['Session ID,Created At,Message Count,Resolved,First Question'];
      for (const conv of (conversations || [])) {
        const msgs = Array.isArray(conv.messages) ? conv.messages : [];
        const firstQ = msgs.find((m: any) => m.role === 'user')?.content || '';
        const escaped = sanitizeCsvValue(firstQ.replace(/\n/g, ' '));
        csvRows.push(`"${conv.session_id}","${conv.created_at}",${conv.message_count},${conv.resolved},"${escaped}"`);
      }
      
      return new NextResponse(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="conversations-${clientId}.csv"`,
        },
      });
    }

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Export API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
