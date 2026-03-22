import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  MessageSquareText,
  ShieldCheck,
  UserPlus,
  Zap
} from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ConversationViewer } from "./conversation-viewer";

type ConversationRecord = {
  id: string;
  session_id: string;
  created_at: string;
  messages: Array<{ role?: string; content?: string; timestamp?: string }>;
  resolved: boolean;
  estimated_tokens: number;
};

type LeadRecord = {
  session_id: string;
  name: string | null;
  email: string;
};

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const db = supabase as any;

  // Check if admin
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await db
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .maybeSingle();
  const isAdmin = profile?.role === "admin";

  const { data: client, error: clientError } = await db
    .from("clients")
    .select("id, name")
    .eq("id", id)
    .single();

  if (clientError || !client) {
    redirect("/clients");
  }

  const { data: conversations, error: conversationsError } = await db
    .from("conversations")
    .select("*")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  if (conversationsError) {
    console.error("Failed to fetch analytics:", conversationsError);
  }

  const convos = ((conversations || []) as ConversationRecord[]).map((conversation) => ({
    ...conversation,
    messages: Array.isArray(conversation.messages) ? conversation.messages : [],
  }));

  // Fetch leads to map session_id → visitor name/email
  const { data: leads } = await db
    .from("leads")
    .select("session_id, name, email")
    .eq("client_id", client.id);

  const totalLeads = leads?.length || 0;

  // Build lookup: session_id → { name, email }
  const leadMap = new Map<string, { name: string | null; email: string }>();
  if (leads) {
    for (const lead of leads as LeadRecord[]) {
      leadMap.set(lead.session_id, { name: lead.name, email: lead.email });
    }
  }

  // Enrich conversations with visitor info
  const enrichedConvos = convos.map((conversation, index) => {
    const lead = leadMap.get(conversation.session_id);
    return {
      ...conversation,
      visitorLabel: lead
        ? lead.name || lead.email
        : `Visitor #${convos.length - index}`,
      visitorEmail: lead?.email || null,
    };
  });

  const totalConversations = convos.length;
  const totalMessages = convos.reduce(
    (acc, conversation) => acc + conversation.messages.length,
    0,
  );

  const totalTokens = convos.reduce(
    (acc, conversation) => acc + (conversation.estimated_tokens || 0),
    0,
  );

  const avgMessages =
    totalConversations > 0 ? (totalMessages / totalConversations).toFixed(1) : "0";
  const resolvedCount = convos.filter((conversation) => conversation.resolved).length;
  const resolutionRate =
    totalConversations > 0
      ? Math.round((resolvedCount / totalConversations) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-400">
            Conversation Analytics
          </p>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-stone-950">
              {client.name} Analytics
            </h1>
            <p className="mt-2 text-sm text-stone-500">
              Review conversation volume, deflection quality, and recent chat
              activity for this client workspace.
            </p>
          </div>
        </div>
        <Link
          href={`/clients/${client.id}`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:text-stone-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Client
        </Link>
      </div>

      <div className={`grid gap-4 md:grid-cols-2 ${isAdmin ? "xl:grid-cols-6" : "xl:grid-cols-5"}`}>
        <StatCard
          title="Total Conversations"
          value={String(totalConversations)}
          description="Unique customer sessions"
          icon={<MessageSquareText className="h-5 w-5 text-teal-700" />}
        />
        <StatCard
          title="Total Messages"
          value={String(totalMessages)}
          description="Combined user and assistant messages"
          icon={<Clock3 className="h-5 w-5 text-stone-700" />}
        />
        <StatCard
          title="Avg. Messages / Chat"
          value={avgMessages}
          description="Average interaction depth"
          icon={<ShieldCheck className="h-5 w-5 text-emerald-700" />}
        />
        <StatCard
          title="Resolution Rate"
          value={`${resolutionRate}%`}
          description="Chats marked as resolved"
          icon={<CheckCircle2 className="h-5 w-5 text-teal-700" />}
        />
        <StatCard
          title="Leads Captured"
          value={String(totalLeads)}
          description="Emails collected via widget"
          icon={<UserPlus className="h-5 w-5 text-blue-700" />}
        />
        {isAdmin && (
          <StatCard
            title="Token Usage"
            value={totalTokens.toLocaleString()}
            description="Estimated Llama 3.3 tokens"
            icon={<Zap className="h-5 w-5 text-amber-500" />}
          />
        )}
      </div>

      <section className="rounded-[1.75rem] border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 px-6 py-5">
          <h2 className="text-xl font-semibold tracking-tight text-stone-950">
            Recent Chat History
          </h2>
          <p className="mt-2 text-sm text-stone-500">
            Click on any conversation to view the full chat transcript.
          </p>
        </div>

        {enrichedConvos.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-600">
              <MessageSquareText className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-lg font-semibold tracking-tight text-stone-950">
              No conversations yet
            </h3>
            <p className="mt-2 text-sm text-stone-500">
              Once visitors start chatting with the widget, their sessions will
              appear here.
            </p>
          </div>
        ) : (
          <ConversationViewer conversations={enrichedConvos.slice(0, 30)} />
        )}
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-stone-500">{title}</div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-100">
          {icon}
        </div>
      </div>
      <div className="mt-5 text-3xl font-semibold tracking-tight text-stone-950">
        {value}
      </div>
      <p className="mt-2 text-sm text-stone-500">{description}</p>
    </div>
  );
}
