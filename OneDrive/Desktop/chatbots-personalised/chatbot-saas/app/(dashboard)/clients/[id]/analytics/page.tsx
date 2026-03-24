import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock3,
  Lock,
  MessageSquareText,
  ShieldCheck,
  UserPlus,
  Zap,
} from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ConversationViewer } from "./conversation-viewer";
import { PLAN_LIMITS, type PlanTier } from "@/lib/constants/pricing";

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

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await db
    .from("profiles")
    .select("role, plan_tier")
    .eq("id", user?.id)
    .maybeSingle();
  const isAdmin = profile?.role === "admin";
  const planTier: PlanTier = profile?.plan_tier || "starter";
  const canViewConversations = isAdmin || PLAN_LIMITS[planTier].features.conversationHistory;

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

  const { data: leads } = await db
    .from("leads")
    .select("session_id, name, email")
    .eq("client_id", client.id);

  const totalLeads = leads?.length || 0;

  const leadMap = new Map<string, { name: string | null; email: string }>();
  if (leads) {
    for (const lead of leads as LeadRecord[]) {
      leadMap.set(lead.session_id, { name: lead.name, email: lead.email });
    }
  }

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
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/20">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
              Analytics
            </p>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-950 sm:text-3xl truncate">
            {client.name}
          </h1>
          <p className="text-sm text-stone-500">
            Conversation volume, deflection quality, and recent activity.
          </p>
        </div>
        <Link
          href={`/clients/${client.id}`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:text-stone-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Client
        </Link>
      </div>

      {/* Stats */}
      <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 ${isAdmin ? "xl:grid-cols-6" : "xl:grid-cols-5"}`}>
        <AnalyticsStatCard
          title="Conversations"
          value={String(totalConversations)}
          subtitle="Unique sessions"
          icon={<MessageSquareText className="h-5 w-5" />}
          gradient="from-blue-500 to-cyan-600"
          shadowColor="shadow-blue-500/20"
        />
        <AnalyticsStatCard
          title="Messages"
          value={String(totalMessages)}
          subtitle="User + assistant"
          icon={<Clock3 className="h-5 w-5" />}
          gradient="from-violet-500 to-purple-600"
          shadowColor="shadow-violet-500/20"
        />
        <AnalyticsStatCard
          title="Avg. per Chat"
          value={avgMessages}
          subtitle="Interaction depth"
          icon={<ShieldCheck className="h-5 w-5" />}
          gradient="from-emerald-500 to-teal-600"
          shadowColor="shadow-emerald-500/20"
        />
        <AnalyticsStatCard
          title="Resolution"
          value={`${resolutionRate}%`}
          subtitle="Chats resolved"
          icon={<CheckCircle2 className="h-5 w-5" />}
          gradient="from-amber-500 to-orange-600"
          shadowColor="shadow-amber-500/20"
        />
        <AnalyticsStatCard
          title="Leads"
          value={String(totalLeads)}
          subtitle="Emails captured"
          icon={<UserPlus className="h-5 w-5" />}
          gradient="from-pink-500 to-rose-600"
          shadowColor="shadow-pink-500/20"
        />
        {isAdmin && (
          <AnalyticsStatCard
            title="Tokens"
            value={totalTokens.toLocaleString()}
            subtitle="Llama 3.3 est."
            icon={<Zap className="h-5 w-5" />}
            gradient="from-red-500 to-rose-600"
            shadowColor="shadow-red-500/20"
          />
        )}
      </div>

      {/* Conversation History */}
      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 px-6 py-5">
          <h2 className="text-lg font-semibold tracking-tight text-stone-950">
            Recent Chat History
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            {canViewConversations
              ? "Click on any conversation to view the full transcript."
              : "Upgrade to Pro or Business to unlock conversation history."}
          </p>
        </div>

        {!canViewConversations ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100">
              <Lock className="h-7 w-7 text-amber-600" />
            </div>
            <h3 className="mt-5 text-lg font-semibold tracking-tight text-stone-950">
              Pro Feature
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">
              Your Starter plan includes summary analytics. Upgrade to <strong>Pro</strong> or <strong>Business</strong> for full transcripts and visitor details.
            </p>
            <Link
              href={`/clients/${client.id}/billing`}
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-6 text-sm font-semibold text-white shadow-lg shadow-stone-950/10 transition hover:bg-stone-800"
            >
              <Zap className="h-4 w-4" />
              Upgrade Plan
            </Link>
          </div>
        ) : enrichedConvos.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100">
              <MessageSquareText className="h-7 w-7 text-stone-400" />
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

function AnalyticsStatCard({
  title,
  value,
  subtitle,
  icon,
  gradient,
  shadowColor,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  shadowColor: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            {title}
          </p>
          <p className="text-2xl font-bold tracking-tight text-stone-950">
            {value}
          </p>
          <p className="text-xs text-stone-500">{subtitle}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg ${shadowColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
