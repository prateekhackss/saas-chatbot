import { DashboardChrome } from "@/components/dashboard/dashboard-chrome";
import { createClient } from "@/lib/supabase/server";
import { PLAN_LIMITS, PlanTier } from "@/lib/constants/pricing";
import { redirect } from "next/navigation";
import { getCurrentTenant } from "@/lib/tenant";
import { TenantProvider } from "@/lib/tenant-context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const db = supabase as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch current tenant — redirect to onboarding if none
  const tenantData = await getCurrentTenant();
  if (!tenantData) {
    redirect("/onboarding");
  }

  // Fetch user role and subscription from profiles
  let isAdmin = false;
  let hasActiveSubscription = false;
  const { data: profile } = await db
    .from("profiles")
    .select("role, subscription_status, plan_tier")
    .eq("id", user.id)
    .maybeSingle();
  isAdmin = profile?.role === "admin";
  // User-level subscription check (survives client deletion)
  hasActiveSubscription = ["active", "trialing", "past_due"].includes(
    profile?.subscription_status || ""
  );

  // Check client usage for warning banner — scoped to current tenant
  let warningMessage = null;
  let clientWithHighUsage = null;

  const { data: clients } = await db
    .from("clients")
    .select("id, plan_tier, messages_this_month, name, subscription_status")
    .eq("tenant_id", tenantData.tenant.id)
    .eq("is_active", true);

  if (clients && clients.length > 0) {
    for (const client of clients) {
      const tier = (client.plan_tier || profile?.plan_tier || "starter") as PlanTier;
      const limit = PLAN_LIMITS[tier].maxMessages;
      const used = client.messages_this_month || 0;
      if (used >= limit * 0.8) {
        warningMessage = `Warning: ${client.name} has used over 80% of its monthly message limit (${used}/${limit}). Upgrade to ensure continuous service.`;
        clientWithHighUsage = client;
        break;
      }
    }
  }

  return (
    <TenantProvider tenant={tenantData.tenant} role={tenantData.role}>
    <DashboardChrome
      userEmail={user?.email || "Signed in"}
      isAdmin={isAdmin}
      hasActiveSubscription={hasActiveSubscription}
      tenantName={tenantData.tenant.name}
    >
      <div className="flex-1 w-full max-w-7xl mx-auto">
        {/* Usage warning banner */}
        {warningMessage && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-400 shadow-sm">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {warningMessage}
            </div>
            <a href={`/clients/${clientWithHighUsage?.id}/billing`} className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-stone-950 transition-colors hover:bg-amber-400 shrink-0 ml-4">
              Upgrade Plan
            </a>
          </div>
        )}

        {/* Subscription banner — only for regular users, not admins */}
        {!hasActiveSubscription && !isAdmin && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm shadow-sm">
            <div className="flex items-center gap-2 text-rose-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">
                You don&apos;t have an active plan yet. Subscribe to create chatbots and start serving customers.
              </span>
            </div>
            <a href="/checkout" className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-rose-700 shrink-0 ml-4">
              View Plans
            </a>
          </div>
        )}

        {children}
      </div>
    </DashboardChrome>
    </TenantProvider>
  );
}
