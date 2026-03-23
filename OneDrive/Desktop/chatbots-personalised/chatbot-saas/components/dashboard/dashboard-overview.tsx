import Link from "next/link";
import { Activity, Bot, MessageSquareText, Users, MailPlus, Zap, UserX, Crown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export async function DashboardOverview() {
  const supabase = await createClient();
  const db = supabase as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if admin
  const { data: profile } = await db
    .from("profiles")
    .select("role, plan_tier, subscription_status")
    .eq("id", user?.id)
    .maybeSingle();

  const isAdmin = profile?.role === "admin";

  // Fetch user's own clients — explicit user_id filter for non-admin (defense-in-depth over RLS)
  let clientsQuery = db.from("clients").select("id, is_active, name, messages_this_month, plan_tier");
  if (!isAdmin) {
    clientsQuery = clientsQuery.eq("user_id", user?.id);
  }
  const { data: clients } = await clientsQuery;
  const totalClients = clients?.length || 0;
  const activeBots = clients?.filter((client: any) => client.is_active).length || 0;

  // Get IDs of this user's clients to scope conversations and leads
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

  // Admin-only: deleted accounts audit trail
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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">
          {isAdmin ? "Platform Overview" : "Dashboard"}
        </h1>
        <p className="text-stone-500">
          {isAdmin
            ? "Monitor your entire SaaS chatbot network at a glance."
            : "Your chatbot performance and usage at a glance."}
        </p>
      </div>

      {/* ─── Stats Grid ─── */}
      <div className={`grid gap-6 md:grid-cols-2 ${isAdmin ? "lg:grid-cols-3 xl:grid-cols-4" : "lg:grid-cols-3"} animate-fade-in-up`}>
        <StatCard
          title={isAdmin ? "Total Clients" : "Your Chatbots"}
          value={isAdmin ? totalClients.toString() : activeBots.toString()}
          subtitle={isAdmin ? "Registered accounts" : `${activeBots} active of ${totalClients} total`}
          icon={<Users className="h-4 w-4 text-stone-400" />}
        />
        {isAdmin && (
          <StatCard
            title="Active Chatbots"
            value={activeBots.toString()}
            subtitle="Currently serving widgets"
            icon={<Activity className="h-4 w-4 text-emerald-500" />}
          />
        )}
        <StatCard
          title="Total Conversations"
          value={conversations?.length.toString() || "0"}
          subtitle={isAdmin ? "Across all clients" : "Across your bots"}
          icon={<MessageSquareText className="h-4 w-4 text-stone-400" />}
        />
        <StatCard
          title="Total Messages"
          value={totalMessages.toString()}
          subtitle={isAdmin ? "Estimated Llama 3.3 usage" : "Messages exchanged"}
          icon={<Bot className="h-4 w-4 text-stone-400" />}
        />
        <StatCard
          title="Lead Captures"
          value={totalLeads?.toString() || "0"}
          subtitle="Emails collected"
          icon={<MailPlus className="h-4 w-4 text-blue-500" />}
        />

        {/* Admin-only cards */}
        {isAdmin && (
          <>
            <StatCard
              title="Total Tokens Estimated"
              value={totalUsageTokens.toLocaleString()}
              subtitle="Calculated from transcripts"
              icon={<Zap className="h-4 w-4 text-rose-500" />}
            />
            <StatCard
              title="Deleted Accounts"
              value={totalDeleted.toString()}
              subtitle="Audit trail preserved"
              icon={<UserX className="h-4 w-4 text-stone-400" />}
            />
          </>
        )}
      </div>

      {/* ─── User Plan Info (non-admin only) ─── */}
      {!isAdmin && profile?.subscription_status && (
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100">
                <Crown className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900 capitalize">
                  {profile.plan_tier || "starter"} Plan
                </p>
                <p className="text-xs text-stone-400">
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
              className="text-xs font-semibold text-stone-500 transition hover:text-stone-900"
            >
              Manage →
            </Link>
          </div>
        </div>
      )}

      {/* ─── Quick Actions ─── */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold text-stone-900">
          Quick Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 animate-fade-in-up animation-delay-150">
          <Link
            href="/clients"
            className="flex items-center rounded-xl border border-stone-200 bg-stone-50 p-4 transition-colors hover:bg-stone-100"
          >
            <div className="mr-4 rounded-lg bg-rose-100 p-2 transition-transform hover:scale-110">
              <Users className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <div className="font-medium text-stone-900">
                {isAdmin ? "Manage Clients" : "My Chatbots"}
              </div>
              <div className="text-sm text-stone-500">
                {isAdmin ? "View and edit client configurations." : "View and configure your chatbots."}
              </div>
            </div>
          </Link>
          <Link
            href="/clients/new"
            className="flex items-center rounded-xl border border-stone-200 bg-stone-50 p-4 transition-colors hover:bg-stone-100"
          >
            <div className="mr-4 rounded-lg bg-stone-200 p-2 transition-transform hover:scale-110">
              <Bot className="h-5 w-5 text-stone-700" />
            </div>
            <div>
              <div className="font-medium text-stone-900">
                {isAdmin ? "Deploy New Bot" : "Create New Bot"}
              </div>
              <div className="text-sm text-stone-500">
                {isAdmin ? "Onboard a new customer to the platform." : "Launch a new chatbot for your business."}
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* ─── Deleted Accounts Audit Log — admin only ─── */}
      {isAdmin && deletedAccounts.length > 0 && (
        <div className="mt-8 animate-fade-in-up animation-delay-150">
          <div className="flex items-center gap-2 mb-4">
            <UserX className="h-5 w-5 text-stone-400" />
            <h2 className="text-xl font-semibold text-stone-900">
              Deleted Accounts
            </h2>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500">
              Audit Log
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50">
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Plan</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Clients</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Messages</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Deleted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {deletedAccounts.map((account: any) => (
                    <tr key={account.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-stone-900">{account.email}</td>
                      <td className="px-4 py-3 text-stone-600">{account.full_name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600 capitalize">
                          {account.plan_tier || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-600">{account.total_clients}</td>
                      <td className="px-4 py-3 text-stone-600">{account.total_messages?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-stone-500 text-xs">
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
          </div>
        </div>
      )}
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
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
      <div className="flex flex-row items-center justify-between pb-2">
        <h3 className="text-sm font-medium text-stone-500">{title}</h3>
        {icon}
      </div>
      <div className="text-3xl font-bold text-stone-900">{value}</div>
      <p className="mt-1 text-xs text-stone-500">{subtitle}</p>
    </div>
  );
}
