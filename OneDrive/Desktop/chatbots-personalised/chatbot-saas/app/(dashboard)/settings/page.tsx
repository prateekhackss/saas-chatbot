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

  // User-level subscription check
  const hasActiveSub = ["active", "trialing", "past_due"].includes(
    profile?.subscription_status || ""
  );
  const userPlanTier = (profile?.plan_tier || "starter") as PlanTier;

  // Fetch user's clients for billing/usage section
  const { data: clients } = await db
    .from("clients")
    .select(
      "id, name, plan_tier, messages_this_month, subscription_status, is_active"
    )
    .eq("user_id", user.id);

  const activeClients = (clients || []).filter((c: any) => c.is_active);

  // Admin stats
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
      {/* Page Header */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-400">
          Preferences
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-950">
          Account Settings
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          Manage your profile, security, notifications, and data.
        </p>
      </div>

      {/* ─── PROFILE ─── */}
      <SettingsSection
        icon={<User className="h-5 w-5" />}
        title="Profile Information"
        description="Your personal details and preferences"
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
        description="Your current plan, usage stats, and subscription management"
      >
        {activeClients.length === 0 ? (
          <div className="rounded-xl border border-stone-100 bg-stone-50 p-6 text-center">
            <Zap className="mx-auto h-8 w-8 text-stone-400" />
            <p className="mt-3 text-sm font-medium text-stone-600">
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
              // Use user's plan tier for limits (not per-client tier)
              const limits = PLAN_LIMITS[userPlanTier];
              const used = client.messages_this_month || 0;
              const pct = Math.min((used / limits.maxMessages) * 100, 100);

              return (
                <div
                  key={client.id}
                  className="rounded-xl border border-stone-200 bg-white p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100">
                        <MessageSquareText className="h-5 w-5 text-stone-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-stone-900">
                          {client.name}
                        </h3>
                        <p className="text-xs text-stone-400">
                          <span className="capitalize">{userPlanTier}</span> Plan
                          {profile?.subscription_status === "trialing" &&
                            " — Trial"}
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
                      <span className="text-stone-500">
                        Messages this month
                      </span>
                      <span className="font-semibold text-stone-700">
                        {used.toLocaleString()} / {limits.maxMessages.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct >= 90
                            ? "bg-red-500"
                            : pct >= 70
                              ? "bg-amber-500"
                              : "bg-emerald-500"
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
      >
        <NotificationSettings initial={notificationPrefs} />
      </SettingsSection>

      {/* ─── SECURITY ─── */}
      <SettingsSection
        icon={<Shield className="h-5 w-5" />}
        title="Security"
        description="Manage your account security and authentication"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 p-4">
            <div>
              <div className="text-sm font-medium text-stone-900">
                Password
              </div>
              <div className="text-xs text-stone-400">
                Change your account password via email reset
              </div>
            </div>
            <a
              href="/forgot-password"
              className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-50 hover:text-stone-900"
            >
              Reset Password
            </a>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 p-4">
            <div>
              <div className="text-sm font-medium text-stone-900">
                Two-Factor Authentication
              </div>
              <div className="text-xs text-stone-400">
                Additional security for your account (coming soon)
              </div>
            </div>
            <span className="rounded-lg bg-stone-200 px-3 py-1.5 text-xs font-medium text-stone-500">
              Coming Soon
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 p-4">
            <div>
              <div className="text-sm font-medium text-stone-900">
                Active Sessions
              </div>
              <div className="text-xs text-stone-400">
                You are currently signed in as {user.email}
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          </div>
        </div>
      </SettingsSection>

      {/* ─── DATA & PRIVACY ─── */}
      <SettingsSection
        icon={<Database className="h-5 w-5" />}
        title="Data & Privacy"
        description="Manage your data, export, and privacy preferences"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-stone-100 bg-stone-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-stone-900">
                  Export Your Data
                </div>
                <div className="text-xs text-stone-400">
                  Download all your data as JSON (GDPR data portability)
                </div>
              </div>
              <ExportDataButton />
            </div>
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
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-rose-200" />
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-500">
              <Crown className="h-3 w-3" />
              Admin Controls
            </span>
            <div className="h-px flex-1 bg-rose-200" />
          </div>

          <SettingsSection
            icon={<Building2 className="h-5 w-5" />}
            title="Platform Overview"
            description="Global platform statistics and health"
            accent="rose"
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <AdminStatCard
                icon={<Users className="h-4 w-4" />}
                label="Total Users"
                value={adminStats.totalUsers}
              />
              <AdminStatCard
                icon={<Globe className="h-4 w-4" />}
                label="Total Bots"
                value={adminStats.totalClients}
              />
              <AdminStatCard
                icon={<MessageSquareText className="h-4 w-4" />}
                label="Conversations"
                value={adminStats.totalConversations}
              />
              <AdminStatCard
                icon={<FileText className="h-4 w-4" />}
                label="Documents"
                value={adminStats.totalDocuments}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
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
            accent="rose"
          >
            <div className="space-y-3">
              <div className="rounded-xl border border-stone-100 bg-stone-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-stone-900">
                      Webhook Endpoint (LemonSqueezy)
                    </div>
                    <div className="mt-1 font-mono text-xs text-stone-400">
                      /api/webhooks/lemonsqueezy
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-stone-100 bg-stone-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-stone-900">
                      Chat API Endpoint
                    </div>
                    <div className="mt-1 font-mono text-xs text-stone-400">
                      /api/chat
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-stone-100 bg-stone-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-stone-900">
                      Embed Widget Endpoint
                    </div>
                    <div className="mt-1 font-mono text-xs text-stone-400">
                      /api/embed/[slug]
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                </div>
              </div>
            </div>
          </SettingsSection>
        </>
      )}

      {/* ─── DANGER ZONE ─── */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="h-px flex-1 bg-red-200" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-400">
            Danger Zone
          </span>
          <div className="h-px flex-1 bg-red-200" />
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
  accent,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent?: "rose";
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            accent === "rose"
              ? "bg-rose-100 text-rose-600"
              : "bg-stone-100 text-stone-600"
          }`}
        >
          {icon}
        </div>
        <div>
          <h2 className="text-base font-semibold text-stone-900">{title}</h2>
          <p className="text-xs text-stone-400">{description}</p>
        </div>
      </div>
      {children}
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
      <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">
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

function AdminStatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-center">
      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
        {icon}
      </div>
      <div className="mt-2 text-lg font-bold tracking-tight text-stone-900">
        {value.toLocaleString()}
      </div>
      <div className="text-[10px] font-medium uppercase tracking-[0.15em] text-stone-400">
        {label}
      </div>
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
