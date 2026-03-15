import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Users, Bot, MessageSquareText, Activity } from 'lucide-react';

export default async function DashboardHome() {
  const supabase = createClient();
  const db = supabase as any;

  // 1. Fetch Aggregate Statistics
  const { data: clients, error: clientsError } = await db
    .from('clients')
    .select('id, is_active');
    
  const totalClients = clients?.length || 0;
  const activeBots = clients?.filter((c: any) => c.is_active).length || 0;

  // We need to count total messages across all conversations.
  // In a massive production app we'd use a SQL View, but for now we aggregate.
  const { data: conversations } = await db
    .from('conversations')
    .select('message_count');
    
  let totalMessages = 0;
  if (conversations) {
    totalMessages = conversations.reduce((acc: number, conv: any) => acc + (conv.message_count || 0), 0);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Platform Overview</h1>
        <p className="text-slate-500">Monitor your entire SaaS Chatbot network at a glance.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-slate-500">Total Clients</h3>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{totalClients}</div>
          <p className="text-xs text-slate-500 mt-1">Registered accounts</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-slate-500">Active Chatbots</h3>
            <Activity className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{activeBots}</div>
          <p className="text-xs text-slate-500 mt-1">Currently serving widgets</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-slate-500">Total Conversations</h3>
            <MessageSquareText className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{conversations?.length || 0}</div>
          <p className="text-xs text-slate-500 mt-1">Across all clients</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-slate-500">Total Tokens</h3>
            <Bot className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{totalMessages}</div>
          <p className="text-xs text-slate-500 mt-1">Estimated Llama 3.3 usage</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-slate-900">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/clients" className="flex items-center p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">
            <div className="bg-blue-100 p-2 rounded-lg mr-4">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-slate-900">Manage Clients</div>
              <div className="text-sm text-slate-500">View and edit client configurations.</div>
            </div>
          </Link>
          <Link href="/clients/new" className="flex items-center p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">
            <div className="bg-green-100 p-2 rounded-lg mr-4">
              <Bot className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-slate-900">Deploy New Bot</div>
              <div className="text-sm text-slate-500">Onboard a new customer to the platform.</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
