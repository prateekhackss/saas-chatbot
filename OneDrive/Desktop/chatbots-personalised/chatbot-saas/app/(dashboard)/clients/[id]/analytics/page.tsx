import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const db = supabase as any;

  // 1. Fetch Client
  const { data: client, error: clientError } = await db
    .from('clients')
    .select('id, name')
    .eq('id', id)
    .single();

  if (clientError || !client) {
    redirect('/clients');
  }

  // 2. Fetch all conversations for this client
  // In a real production app with millions of rows, we'd paginate this
  // or use an aggregated materialized view.
  const { data: conversations, error: convosError } = await db
    .from('conversations')
    .select('*')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false });

  if (convosError) {
    console.error('Failed to fetch analytics:', convosError);
  }

  const convos = conversations || [];
  
  // Calculate basic analytics
  const totalConversations = convos.length;
  const totalMessages = convos.reduce((acc: number, c: any) => acc + (c.messages?.length || 0), 0);
  const avgMessages = totalConversations > 0 ? (totalMessages / totalConversations).toFixed(1) : '0';
  const resolvedCount = convos.filter((c: any) => c.resolved).length;
  const resolutionRate = totalConversations > 0 ? Math.round((resolvedCount / totalConversations) * 100) : 0;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics - {client.name}</h2>
          <p className="text-muted-foreground mt-2">Overview of chatbot engagement and chat history.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Conversations</h3>
          </div>
          <div>
            <div className="text-2xl font-bold">{totalConversations}</div>
            <p className="text-xs text-gray-500 mt-1">Unique chat sessions</p>
          </div>
        </div>
        
        <div className="rounded-xl border bg-white shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Messages</h3>
          </div>
          <div>
            <div className="text-2xl font-bold">{totalMessages}</div>
            <p className="text-xs text-gray-500 mt-1">Exchanged between users & AI</p>
          </div>
        </div>

        <div className="rounded-xl border bg-white shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Avg. Messages / Chat</h3>
          </div>
          <div>
            <div className="text-2xl font-bold">{avgMessages}</div>
            <p className="text-xs text-gray-500 mt-1">Interaction depth</p>
          </div>
        </div>

        <div className="rounded-xl border bg-white shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Deflection Rate</h3>
          </div>
          <div>
            <div className="text-2xl font-bold">{resolutionRate}%</div>
            <p className="text-xs text-gray-500 mt-1">Chats marked as resolved</p>
          </div>
        </div>
      </div>

      {/* Chat History Table */}
      <h3 className="text-xl font-semibold mt-10 mb-4">Recent Chat History</h3>
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="w-full overflow-auto">
          <table className="w-full text-sm text-left border-collapse">
             <thead className="bg-muted text-muted-foreground">
                <tr>
                   <th className="px-6 py-4 font-medium border-b">Session ID</th>
                   <th className="px-6 py-4 font-medium border-b text-center">Messages</th>
                   <th className="px-6 py-4 font-medium border-b text-center">Status</th>
                   <th className="px-6 py-4 font-medium border-b">Date</th>
                   <th className="px-6 py-4 font-medium border-b rounded-tr-lg">Action</th>
                </tr>
             </thead>
             <tbody>
                {convos.length === 0 ? (
                  <tr>
                     <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                        No conversations yet.
                     </td>
                  </tr>
                ) : (
                  convos.slice(0, 20).map((c: any) => (
                    <tr key={c.id} className="border-b transition-colors hover:bg-muted/50 last:border-0">
                       <td className="px-6 py-4 font-mono text-xs">{c.session_id.substring(0, 12)}...</td>
                       <td className="px-6 py-4 text-center">{c.messages?.length || 0}</td>
                       <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${c.resolved ? 'bg-black text-white' : 'bg-gray-100 text-gray-900 border-gray-200'}`}>
                             {c.resolved ? "Resolved" : "Open"}
                          </span>
                       </td>
                       <td className="px-6 py-4 text-xs text-gray-500">
                          {new Date(c.created_at).toLocaleString()}
                       </td>
                       <td className="px-6 py-4 text-xs">
                          {/* In a real app this would open a modal with the chat log JSON */}
                          <button className="text-blue-600 hover:underline">View Transcript</button>
                       </td>
                    </tr>
                  ))
                )}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
