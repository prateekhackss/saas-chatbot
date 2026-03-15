import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const db = supabase as any;
    
    // 1. Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const daysParam = searchParams.get('days');
    const days = daysParam ? parseInt(daysParam, 10) : 30; // default 30 days

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Calculate the date X days ago
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    // 2. Fetch conversations
    const { data: conversations, error } = await db
      .from('conversations')
      .select('id, message_count, resolved, messages, created_at')
      .eq('client_id', clientId)
      .gte('created_at', dateLimit.toISOString());

    if (error) {
       console.error('Analytics DB error:', error);
       return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    // 3. Process the raw data into metrics
    let totalMessages = 0;
    
    // For storing daily volumes (Map: YYYY-MM-DD -> count)
    const dailyVolumeMap = new Map<string, number>();
    
    // For extracting user questions (to find top questions)
    // In a massive production app this would ideally be done via specialized DB queries or warehouses,
    // but doing it in-memory here works perfectly for our SaaS scale.
    const questionCounts = new Map<string, number>();

    const conversationRows = (conversations || []) as Array<{
      message_count?: number;
      messages?: any[];
      created_at: string;
    }>;

    for (const conv of conversationRows) {
      totalMessages += (conv.message_count || 0);

      // Track daily volume
      const dateKey = new Date(conv.created_at).toISOString().split('T')[0];
      dailyVolumeMap.set(dateKey, (dailyVolumeMap.get(dateKey) || 0) + 1);

      // Extract raw messages to find popular questions
      // Messages JSONB structure is array of { role, content, timestamp }
      const messagesArray = (conv.messages as any[]) || [];
      if (messagesArray.length > 0) {
        // The first message is usually the user's initial question that started the chat
        const firstMessage = messagesArray[0];
        if (firstMessage && firstMessage.role === 'user' && typeof firstMessage.content === 'string') {
          // Normalize the string a bit before counting to group similar questions
          let normalizedQ = firstMessage.content.trim();
          if (normalizedQ.length < 100) { // Only track short distinct questions
             questionCounts.set(normalizedQ, (questionCounts.get(normalizedQ) || 0) + 1);
          }
        }
      }
    }

    // Sort questions by popularity
    const sortedQuestions = Array.from(questionCounts.entries())
      .sort((a, b) => b[1] - a[1]) // highest count first
      .slice(0, 5) // top 5
      .map(([question, count]) => ({ question, count }));

    // Format daily volume for charting
    const formattedDailyVolume = Array.from(dailyVolumeMap.entries())
       .sort((a, b) => a[0].localeCompare(b[0])) // Sort by date ascending
       .map(([date, count]) => ({ date, conversations: count }));

    // Determine the averages safely
    const totalConversations = conversationRows.length;
    const avgMessagesPerConversation = totalConversations > 0 
      ? Number((totalMessages / totalConversations).toFixed(1)) 
      : 0;

    return NextResponse.json({
      totalConversations,
      totalMessages,
      avgMessagesPerConversation,
      topQuestions: sortedQuestions,
      dailyVolume: formattedDailyVolume
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
