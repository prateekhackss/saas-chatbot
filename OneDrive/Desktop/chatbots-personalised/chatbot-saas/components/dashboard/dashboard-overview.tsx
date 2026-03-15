import Link from "next/link";
import { Activity, Bot, MessageSquareText, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export async function DashboardOverview() {
  const supabase = await createClient();
  const db = supabase as any;

  const { data: clients } = await db.from("clients").select("id, is_active");
  const totalClients = clients?.length || 0;
  const activeBots = clients?.filter((client: any) => client.is_active).length || 0;

  const { data: conversations } = await db
    .from("conversations")
    .select("message_count");

  let totalMessages = 0;
  if (conversations) {
    totalMessages = conversations.reduce(
      (acc: number, conversation: any) =>
        acc + (conversation.message_count || 0),
      0,
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Platform Overview
        </h1>
        <p className="text-slate-500">
          Monitor your entire SaaS chatbot network at a glance.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Clients"
          value={totalClients}
          subtitle="Registered accounts"
          icon={<Users className="h-4 w-4 text-slate-400" />}
        />
        <StatCard
          title="Active Chatbots"
          value={activeBots}
          subtitle="Currently serving widgets"
          icon={<Activity className="h-4 w-4 text-emerald-500" />}
        />
        <StatCard
          title="Total Conversations"
          value={conversations?.length || 0}
          subtitle="Across all clients"
          icon={<MessageSquareText className="h-4 w-4 text-slate-400" />}
        />
        <StatCard
          title="Total Tokens"
          value={totalMessages}
          subtitle="Estimated Llama 3.3 usage"
          icon={<Bot className="h-4 w-4 text-slate-400" />}
        />
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">
          Quick Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/clients"
            className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100"
          >
            <div className="mr-4 rounded-lg bg-blue-100 p-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-slate-900">Manage Clients</div>
              <div className="text-sm text-slate-500">
                View and edit client configurations.
              </div>
            </div>
          </Link>
          <Link
            href="/clients/new"
            className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100"
          >
            <div className="mr-4 rounded-lg bg-emerald-100 p-2">
              <Bot className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="font-medium text-slate-900">Deploy New Bot</div>
              <div className="text-sm text-slate-500">
                Onboard a new customer to the platform.
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-row items-center justify-between pb-2">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        {icon}
      </div>
      <div className="text-3xl font-bold text-slate-900">{value}</div>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}
