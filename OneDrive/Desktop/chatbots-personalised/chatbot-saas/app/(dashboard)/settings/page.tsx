import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DeleteAccountForm } from "@/components/dashboard/delete-account-form";
import { ProfileForm } from "@/components/dashboard/settings/profile-form";
import { NotificationSettings } from "@/components/dashboard/settings/notification-settings";
import { ExportDataButton } from "@/components/dashboard/settings/export-data-button";
import {
  Bell,
  Building2,
  CreditCard,
  Crown,
  Database,
  FileText,
  Globe,
  Key,
  MessageSquareText,
  Settings,
  Shield,
  User,
  Users,
  Zap,
} from "lucide-react";
import { PLAN_LIMITS, PlanTier } from "@/lib/constants/pricing";

export const metadata = {
  title: "Settings | NexusChat",
  description: "Manage your account settings",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const db = supabase as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await db
    .from("profiles")
    .select(
      "full_name, company_name, role, timezone, notification_preferences, subscription_status, plan_tier"
    )
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = profile?.role === "admin";
  const hasActiveSub = ["active", "trialing", "past_due"].includes(
    profile?.subscription_status || ""
  );
  const userPlanTier = (profile?.plan_tier || "starter") as PlanTier;

  const { data: clients } = await db
    .from("clients")
    .select(
      "id, name, plan_tier, messages_this_month, subscription_status, is_active"
    )
    .eq("user_id", user.id);

  const activeClients = (clients || []).filter((c: any) => c.is_active);

  let adminStats = null;
  if (isAdmin) {
    const [
      { count: totalUsers },
      { count: totalClients },
      { count: totalConversations },
      { count: totalDocuments },
    ] = await Promise.all([
      db.from("profiles").select("id", { count: "exact", head: true }),
      db.from("clients").select("id", { count: "exact", head: true }),
      db.from("conversations").select("id", { count: "exact", head: true }),
      db.from("documents").select("id", { count: "exact", head: true }),
    ]);
    adminStats = {
      totalUsers: totalUsers || 0,
      totalClients: totalClients || 0,
      totalConversations: totalConversations || 0,
      totalDocuments: totalDocuments || 0,
    };
  }

  const notificationPrefs = profile?.notification_preferences || {
    newLead: true,
    newConversation: false,
    usageAlert: true,
    weeklyDigest: false,
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-stone-700 to-stone-900 shadow-lg shadow-stone-500/10">
            <Settings className="h-4 w-4 text-white" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
            Preferences
          </p>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-stone-950">
          Account Settings
        </h1>
        <p className="text-sm text-stone-500">
          Manage your profile, security, notifications, and data.
        </p>
      </div>

      {/* ─── PROFILE ─── */}
      <SettingsSection
        icon={<User className="h-5 w-5" />}
        title="Profile Information"
        description="Your personal details and preferences"
        gradient="from-violet-500 to-purple-600"
      >
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          <ReadonlyField label="Email" value={user.email || "—"} />
          <ReadonlyField label="Account ID" value={user.id} mono />
          <ReadonlyField
            label="Role"
            value={profile?.role || "user"}
            badge={isAdmin}
          />
          <ReadonlyField
            label="Member Since"
            value={formatDate(user.created_at)}
          />
        </div>
        <div className="border-t border-stone-100 pt-5">
          <ProfileForm
            initialName={profile?.full_name || ""}
            initialCompany={profile?.company_name || ""}
            initialTimezone={profile?.timezone || ""}
          />
        </div>
      </SettingsSection>

      {/* ─── BILLING & USAGE ─── */}
      <SettingsSection
        icon={<CreditCard className="h-5 w-5" />}
        title="Billing & Usage"
        description="Your current plan, usage stats, and subscription"
        gradient="from-emerald-500 to-teal-600"
      >
        {activeClients.length === 0 ? (
          <div className="rounded-xl border border-stone-100 bg-stone-50 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-200">
              <Zap className="h-6 w-6 text-stone-500" />
            </div>
            <p className="mt-4 text-sm font-medium text-stone-600">
              No active chatbots yet
            </p>
            <p className="mt-1 text-xs text-stone-400">
              Create a client to start your subscription.
            </p>
            <Link
              href="/clients/new"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
            >
              Create Client
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeClients.map((client: any) => {
              const limits = PLAN_LIMITS[userPlanTier];
              const used = client.messages_this_month || 0;
              const pct = Math.min((used / limits.maxMessages) * 100, 100);

              return (
                <div
                  key={client.id}
                  className="group rounded-xl border border-stone-200 bg-white p-4 transition-all hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-stone-100 to-stone-200">
                        <MessageSquareText className="h-5 w-5 text-stone-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-stone-900">
                          {client.name}
                        </h3>
                        <p className="text-xs text-stone-400">
                          <span className="capitalize">{userPlanTier}</span> Plan
                          {profile?.subscription_status === "trialing" && " — Trial"}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/clients/${client.id}`}
                      className="text-xs font-semibold text-stone-500 transition hover:text-stone-900"
                    >
                      Manage →
                    </Link>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-500">Messages this month</span>
                      <span className="font-semibold text-stone-700">
                        {used.toLocaleString()} / {limits.maxMessages.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct >= 90
                            ? "bg-gradient-to-r from-red-500 to-rose-500"
                            : pct >= 70
                              ? "bg-gradient-to-r from-amber-500 to-orange-500"
                              : "bg-gradient-to-r from-emerald-500 to-teal-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex gap-4 text-xs text-stone-400">
                      <span>Docs: {limits.maxDocs === 999999 ? "Unlimited" : limits.maxDocs}</span>
                      <span>Bots: {limits.maxBots}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {!isAdmin && (
              <div className="flex items-center gap-3 pt-2">
                {hasActiveSub ? (
                  <Link
                    href="/checkout?upgrade=true"
                    className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                  >
                    <Zap className="h-4 w-4" />
                    Upgrade Plan
                  </Link>
                ) : (
                  <Link
                    href="/checkout"
                    className="inline-flex items-center gap-2 rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800"
                  >
                    <CreditCard className="h-4 w-4" />
                    Subscribe Now
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </SettingsSection>

      {/* ─── NOTIFICATIONS ─── */}
      <SettingsSection
        icon={<Bell className="h-5 w-5" />}
        title="Notifications"
        description="Choose what updates you want to receive"
        gradient="from-amber-500 to-orange-600"
      >
        <NotificationSettings initial={notificationPrefs} planTier={userPlanTier} />
      </SettingsSection>

      {/* ─── SECURITY ─── */}
      <SettingsSection
        icon={<Shield className="h-5 w-5" />}
        title="Security"
        description="Manage your account security and authentication"
        gradient="from-blue-500 to-cyan-600"
      >
        <div className="space-y-3">
          <SecurityRow
            title="Password"
            subtitle="Change your account password via email reset"
            action={
              <a
                href="/forgot-password"
                className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-50 hover:text-stone-900"
              >
                Reset
              </a>
            }
          />
          <SecurityRow
            title="Two-Factor Authentication"
            subtitle="Additional security for your account"
            action={
              <span className="rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-500">
                Coming Soon
              </span>
            }
          />
          <SecurityRow
            title="Active Sessions"
            subtitle={`Signed in as ${user.email}`}
            action={
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            }
          />
        </div>
      </SettingsSection>

      {/* ─── DATA & PRIVACY ─── */}
      <SettingsSection
        icon={<Database className="h-5 w-5" />}
        title="Data & Privacy"
        description="Manage your data, export, and privacy preferences"
        gradient="from-pink-500 to-rose-600"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 p-4">
            <div>
              <div className="text-sm font-medium text-stone-900">Export Your Data</div>
              <div className="text-xs text-stone-400">
                Download all your data as JSON (GDPR data portability)
              </div>
            </div>
            <ExportDataButton />
          </div>

          <div className="flex gap-3">
            <Link
              href="/privacy"
              className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
            >
              <FileText className="h-4 w-4" />
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
            >
              <FileText className="h-4 w-4" />
              Terms of Service
            </Link>
          </div>
        </div>
      </SettingsSection>

      {/* ─── ADMIN SECTION ─── */}
      {isAdmin && adminStats && (
        <>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-rose-200 to-transparent" />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-rose-500">
              <Crown className="h-3 w-3" />
              Admin Controls
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-rose-200 to-transparent" />
          </div>

          <SettingsSection
            icon={<Building2 className="h-5 w-5" />}
            title="Platform Overview"
            description="Global platform statistics and health"
            gradient="from-rose-500 to-red-600"
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <AdminStatCard
                icon={<Users className="h-4 w-4" />}
                label="Users"
                value={adminStats.totalUsers}
                gradient="from-violet-500 to-purple-600"
              />
              <AdminStatCard
                icon={<Globe className="h-4 w-4" />}
                label="Bots"
                value={adminStats.totalClients}
                gradient="from-blue-500 to-cyan-600"
              />
              <AdminStatCard
                icon={<MessageSquareText className="h-4 w-4" />}
                label="Chats"
                value={adminStats.totalConversations}
                gradient="from-emerald-500 to-teal-600"
              />
              <AdminStatCard
                icon={<FileText className="h-4 w-4" />}
                label="Docs"
                value={adminStats.totalDocuments}
                gradient="from-amber-500 to-orange-600"
              />
            </div>

            <div className="mt-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
              >
                Full Dashboard →
              </Link>
            </div>
          </SettingsSection>

          <SettingsSection
            icon={<Key className="h-5 w-5" />}
            title="API & Integrations"
            description="Manage platform-level API keys and webhooks"
            gradient="from-rose-500 to-red-600"
          >
            <div className="space-y-3">
              <EndpointRow
                title="Webhook Endpoint (LemonSqueezy)"
                path="/api/webhooks/lemonsqueezy"
              />
              <EndpointRow
                title="Chat API Endpoint"
                path="/api/chat"
              />
              <EndpointRow
                title="Embed Widget Endpoint"
                path="/api/embed/[slug]"
              />
            </div>
          </SettingsSection>
        </>
      )}

      {/* ─── DANGER ZONE ─── */}
      <div>
        <div className="mb-3 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-200 to-transparent" />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-400">
            Danger Zone
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-200 to-transparent" />
        </div>
        <DeleteAccountForm />
      </div>
    </div>
  );
}

/* ─── Helper Components ─── */

function SettingsSection({
  icon,
  title,
  description,
  gradient,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all hover:shadow-md">
      <div className="mb-0 flex items-center gap-3 border-b border-stone-100 px-6 py-4">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-stone-900">{title}</h2>
          <p className="text-xs text-stone-400">{description}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function ReadonlyField({
  label,
  value,
  mono,
  badge,
}: {
  label: string;
  value: string;
  mono?: boolean;
  badge?: boolean;
}) {
  return (
    <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-stone-400">
        {label}
      </div>
      <div
        className={`mt-1 flex items-center gap-2 ${
          mono ? "font-mono text-xs text-stone-500" : "text-sm font-medium text-stone-900"
        }`}
      >
        <span className="truncate capitalize">{value}</span>
        {badge && (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-700">
            <Crown className="h-2 w-2" />
            Admin
          </span>
        )}
      </div>
    </div>
  );
}

function SecurityRow({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 p-4">
      <div>
        <div className="text-sm font-medium text-stone-900">{title}</div>
        <div className="text-xs text-stone-400">{subtitle}</div>
      </div>
      {action}
    </div>
  );
}

function AdminStatCard({
  icon,
  label,
  value,
  gradient,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  gradient: string;
}) {
  return (
    <div className="group rounded-xl border border-stone-100 bg-stone-50 p-3 text-center transition-all hover:shadow-sm hover:-translate-y-0.5">
      <div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-white shadow-sm`}>
        {icon}
      </div>
      <div className="mt-2 text-lg font-bold tracking-tight text-stone-900">
        {value.toLocaleString()}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
        {label}
      </div>
    </div>
  );
}

function EndpointRow({
  title,
  path,
}: {
  title: string;
  path: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 p-4">
      <div>
        <div className="text-sm font-medium text-stone-900">{title}</div>
        <div className="mt-1 font-mono text-xs text-stone-400">{path}</div>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
