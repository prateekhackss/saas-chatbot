import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Crown,
  LayoutDashboard,
  MailPlus,
  MessageSquareText,
  Plus,
  Sparkles,
  TrendingUp,
  UserX,
  Users,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export async function DashboardOverview() {
  const supabase = await createClient();
  const db = supabase as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await db
    .from("profiles")
    .select("role, plan_tier, subscription_status")
    .eq("id", user?.id)
    .maybeSingle();

  const isAdmin = profile?.role === "admin";

  let clientsQuery = db.from("clients").select("id, is_active, name, messages_this_month, plan_tier");
  if (!isAdmin) {
    clientsQuery = clientsQuery.eq("user_id", user?.id);
  }
  const { data: clients } = await clientsQuery;
  const totalClients = clients?.length || 0;
  const activeBots = clients?.filter((client: any) => client.is_active).length || 0;

  const userClientIds: string[] = (clients || []).map((c: any) => c.id);

  let conversations: any[] = [];
  let totalMessages = 0;
  let totalUsageTokens = 0;
  let totalLeads = 0;

  if (userClientIds.length > 0) {
    const { data: convos } = await db
      .from("conversations")
      .select("message_count, estimated_tokens")
      .in("client_id", userClientIds);

    conversations = convos || [];
    totalMessages = conversations.reduce((acc: number, curr: any) => acc + (curr.message_count || 0), 0);
    totalUsageTokens = conversations.reduce((acc: number, curr: any) => acc + (curr.estimated_tokens || 0), 0);

    const { data: leads } = await db
      .from("leads")
      .select("id")
      .in("client_id", userClientIds);

    totalLeads = leads?.length || 0;
  }

  let deletedAccounts: any[] = [];
  let totalDeleted = 0;
  if (isAdmin) {
    const { data } = await db
      .from("deleted_accounts")
      .select("id, email, full_name, plan_tier, total_clients, total_messages, deleted_at")
      .order("deleted_at", { ascending: false })
      .limit(10);
    deletedAccounts = data || [];
    totalDeleted = deletedAccounts.length;
  }

  const totalConversations = conversations?.length || 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/20">
              <LayoutDashboard className="h-4 w-4 text-white" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
              {isAdmin ? "Platform" : "Overview"}
            </p>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-950">
            {isAdmin ? "Platform Overview" : "Welcome back"}
          </h1>
          <p className="text-sm text-stone-500">
            {isAdmin
              ? "Monitor your entire SaaS chatbot network at a glance."
              : "Your chatbot performance and usage at a glance."}
          </p>
        </div>
        <Link
          href="/clients/new"
          className="group inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-5 text-sm font-semibold text-white shadow-lg shadow-stone-950/10 transition-all hover:bg-stone-800 hover:shadow-xl hover:shadow-stone-950/15"
        >
          <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
          {isAdmin ? "Deploy Bot" : "New Chatbot"}
        </Link>
      </div>

      {/* Stats Grid */}
      <div className={`grid gap-4 sm:grid-cols-2 ${isAdmin ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        <StatCard
          title={isAdmin ? "Total Clients" : "Your Chatbots"}
          value={isAdmin ? totalClients : activeBots}
          subtitle={isAdmin ? "Registered accounts" : `${activeBots} active of ${totalClients}`}
          icon={<Users className="h-5 w-5" />}
          gradient="from-violet-500 to-purple-600"
          shadowColor="shadow-violet-500/20"
        />
        {isAdmin && (
          <StatCard
            title="Active Chatbots"
            value={activeBots}
            subtitle="Currently serving widgets"
            icon={<Activity className="h-5 w-5" />}
            gradient="from-emerald-500 to-teal-600"
            shadowColor="shadow-emerald-500/20"
          />
        )}
        <StatCard
          title="Conversations"
          value={totalConversations}
          subtitle={isAdmin ? "Across all clients" : "Across your bots"}
          icon={<MessageSquareText className="h-5 w-5" />}
          gradient="from-blue-500 to-cyan-600"
          shadowColor="shadow-blue-500/20"
        />
        <StatCard
          title="Messages"
          value={totalMessages}
          subtitle={isAdmin ? "Estimated Llama 3.3 usage" : "Messages exchanged"}
          icon={<Bot className="h-5 w-5" />}
          gradient="from-amber-500 to-orange-600"
          shadowColor="shadow-amber-500/20"
        />
        <StatCard
          title="Lead Captures"
          value={totalLeads}
          subtitle="Emails collected"
          icon={<MailPlus className="h-5 w-5" />}
          gradient="from-pink-500 to-rose-600"
          shadowColor="shadow-pink-500/20"
        />
        {isAdmin && (
          <>
            <StatCard
              title="Tokens Used"
              value={totalUsageTokens}
              subtitle="Calculated from transcripts"
              icon={<Zap className="h-5 w-5" />}
              gradient="from-red-500 to-rose-600"
              shadowColor="shadow-red-500/20"
            />
            <StatCard
              title="Deleted Accounts"
              value={totalDeleted}
              subtitle="Audit trail preserved"
              icon={<UserX className="h-5 w-5" />}
              gradient="from-stone-500 to-stone-700"
              shadowColor="shadow-stone-500/20"
            />
          </>
        )}
      </div>

      {/* Plan Info + Quick Actions Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Plan Info */}
        {!isAdmin && profile?.subscription_status ? (
          <div className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-50/80 via-transparent to-transparent" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 shadow-lg shadow-rose-500/20">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold tracking-tight text-stone-900 capitalize">
                    {profile.plan_tier || "starter"} Plan
                  </p>
                  <p className="text-sm text-stone-500">
                    {["active", "trialing"].includes(profile.subscription_status)
                      ? "Active subscription"
                      : profile.subscription_status === "past_due"
                        ? "Payment past due"
                        : "No active subscription"}
                  </p>
                </div>
              </div>
              <Link
                href="/settings"
                className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition hover:border-stone-300 hover:text-stone-900"
              >
                Manage
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <QuickActionCard
            href="/clients"
            icon={<Users className="h-5 w-5" />}
            title={isAdmin ? "Manage Clients" : "My Chatbots"}
            description={isAdmin ? "View and edit client configurations." : "View and configure your chatbots."}
            gradient="from-violet-500 to-purple-600"
          />
        )}

        <QuickActionCard
          href="/clients/new"
          icon={<Sparkles className="h-5 w-5" />}
          title={isAdmin ? "Deploy New Bot" : "Create New Bot"}
          description={isAdmin ? "Onboard a new customer to the platform." : "Launch a new chatbot for your business."}
          gradient="from-blue-500 to-cyan-600"
        />

        {!isAdmin && profile?.subscription_status && (
          <QuickActionCard
            href="/clients"
            icon={<Users className="h-5 w-5" />}
            title="My Chatbots"
            description="View and configure your chatbots."
            gradient="from-emerald-500 to-teal-600"
          />
        )}
      </div>

      {/* Top Performing Bots — quick glance */}
      {clients && clients.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100">
                <TrendingUp className="h-4 w-4 text-stone-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-stone-900">
                  {isAdmin ? "All Chatbots" : "Your Chatbots"}
                </h2>
                <p className="text-xs text-stone-400">Activity this month</p>
              </div>
            </div>
            <Link
              href="/clients"
              className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 transition hover:text-stone-900"
            >
              View All
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-stone-50">
            {(clients as any[]).slice(0, 5).map((client: any, idx: number) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="flex items-center gap-4 px-6 py-3.5 transition hover:bg-stone-50/80"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-xs font-bold text-stone-500">
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-900">
                    {client.name}
                  </p>
                  <p className="text-xs text-stone-400">
                    {client.messages_this_month || 0} messages this month
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                      client.is_active
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        client.is_active ? "bg-emerald-500" : "bg-stone-400"
                      }`}
                    />
                    {client.is_active ? "Active" : "Inactive"}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-stone-300" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Admin Deleted Accounts Audit Log */}
      {isAdmin && deletedAccounts.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-stone-100 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
              <UserX className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-stone-900">
                Deleted Accounts
              </h2>
              <p className="text-xs text-stone-400">Audit trail for compliance</p>
            </div>
            <span className="ml-auto rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Admin Only
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/60">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-400">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-400">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-400">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-400">Clients</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-400">Messages</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-400">Deleted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {deletedAccounts.map((account: any) => (
                  <tr key={account.id} className="transition-colors hover:bg-stone-50/60">
                    <td className="px-6 py-3.5 font-medium text-stone-900">{account.email}</td>
                    <td className="px-6 py-3.5 text-stone-600">{account.full_name || "—"}</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600 capitalize">
                        {account.plan_tier || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-stone-600">{account.total_clients}</td>
                    <td className="px-6 py-3.5 text-stone-600">{account.total_messages?.toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-xs text-stone-400">
                      {new Date(account.deleted_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

/* ─── Stat Card ─── */

function StatCard({
  title,
  value,
  subtitle,
  icon,
  gradient,
  shadowColor,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  shadowColor: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br opacity-[0.06] transition-opacity group-hover:opacity-[0.10]" style={{}} />
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            {title}
          </p>
          <p className="text-3xl font-bold tracking-tight text-stone-950">
            {value.toLocaleString()}
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

/* ─── Quick Action Card ─── */

function QuickActionCard({
  href,
  icon,
  title,
  description,
  gradient,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-stone-50/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative flex items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-stone-900">{title}</p>
          <p className="mt-0.5 text-sm text-stone-500">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-stone-300 transition-all group-hover:translate-x-1 group-hover:text-stone-500" />
      </div>
    </Link>
  );
}
