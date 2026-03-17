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

type ConversationRecord = {
  id: string;
  session_id: string;
  created_at: string;
  messages: Array<{ role?: string; content?: string }>;
  resolved: boolean;
  estimated_tokens: number;
};

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const db = supabase as any;

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
    .select("id")
    .eq("client_id", client.id);
  const totalLeads = leads?.length || 0;

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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
        <StatCard
          title="Token Usage"
          value={totalTokens.toLocaleString()}
          description="Estimated Llama 3.3 tokens"
          icon={<Zap className="h-5 w-5 text-amber-500" />}
        />
      </div>

      <section className="rounded-[1.75rem] border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 px-6 py-5">
          <h2 className="text-xl font-semibold tracking-tight text-stone-950">
            Recent Chat History
          </h2>
          <p className="mt-2 text-sm text-stone-500">
            The latest customer conversations captured by the widget.
          </p>
        </div>

        {convos.length === 0 ? (
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
          <>
            <div className="hidden overflow-x-auto lg:block">
              <div className="grid min-w-[920px] grid-cols-[180px_100px_120px_170px_minmax(0,1fr)] gap-4 border-b border-stone-200 bg-stone-50/80 px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                <span>Session</span>
                <span>Messages</span>
                <span>Status</span>
                <span>Date</span>
                <span>Last User Message</span>
              </div>
              <div className="divide-y divide-stone-100">
                {convos.slice(0, 20).map((conversation) => (
                  <div
                    key={conversation.id}
                    className="grid min-w-[920px] grid-cols-[180px_100px_120px_170px_minmax(0,1fr)] items-center gap-4 px-6 py-5 transition hover:bg-stone-50/80"
                  >
                    <div className="font-mono text-xs text-stone-500">
                      {conversation.session_id.slice(0, 16)}...
                    </div>
                    <div className="text-sm font-semibold text-stone-900">
                      {conversation.messages.length}
                    </div>
                    <StatusPill resolved={conversation.resolved} />
                    <div className="text-sm text-stone-500">
                      {new Date(conversation.created_at).toLocaleString()}
                    </div>
                    <div className="truncate text-sm text-stone-600">
                      {getLatestUserMessage(conversation.messages)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 p-4 lg:hidden">
              {convos.slice(0, 20).map((conversation) => (
                <div
                  key={conversation.id}
                  className="rounded-[1.5rem] border border-stone-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
                        Session
                      </div>
                      <div className="mt-2 truncate font-mono text-xs text-stone-500">
                        {conversation.session_id}
                      </div>
                    </div>
                    <StatusPill resolved={conversation.resolved} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <SummaryTile
                      label="Messages"
                      value={String(conversation.messages.length)}
                    />
                    <SummaryTile
                      label="Date"
                      value={formatShortDate(conversation.created_at)}
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                    <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
                      Last User Message
                    </div>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      {getLatestUserMessage(conversation.messages)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
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

function StatusPill({ resolved }: { resolved: boolean }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold ${
        resolved
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-stone-200 bg-stone-100 text-stone-600"
      }`}
    >
      {resolved ? "Resolved" : "Open"}
    </span>
  );
}

function SummaryTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3">
      <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-stone-900">{value}</div>
    </div>
  );
}

function getLatestUserMessage(
  messages: Array<{ role?: string; content?: string }>,
) {
  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user" && message.content?.trim());

  return latestUserMessage?.content || "No recent user message captured.";
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
