import { DashboardChrome } from "@/components/dashboard/dashboard-chrome";
import { createClient } from "@/lib/supabase/server";
import { PLAN_LIMITS, PlanTier } from "@/lib/constants/pricing";
import { redirect } from "next/navigation";

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

  // Fetch user role from profiles
  let isAdmin = false;
  if (user) {
    const { data: profile } = await db
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = profile?.role === "admin";
  }

  // Check client usage for warning banner (Part 6)
  let warningMessage = null;
  let clientWithHighUsage = null;
  if (user) {
    const { data: clients } = await db
      .from("clients")
      .select("plan_tier, messages_this_month, name, subscription_status")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (clients && clients.length > 0) {
      // Gatekeeping logic: If all clients are incomplete or canceled, force them to checkout
      const hasActiveClient = clients.some((c: any) => 
         ["active", "trialing", "past_due"].includes(c.subscription_status)
      );

      if (!hasActiveClient) {
        redirect("/checkout");
      }

      for (const client of clients) {
        const tier = (client.plan_tier || "starter") as PlanTier;
        const limit = PLAN_LIMITS[tier].maxMessages;
        const used = client.messages_this_month || 0;
        if (used >= limit * 0.8) {
          warningMessage = `Warning: ${client.name} has used over 80% of its monthly message limit (${used}/${limit}). Upgrade to ensure continuous service.`;
          clientWithHighUsage = client;
          break; // Show warning for the first client near limit
        }
      }
    } else {
      // New users with no clients must also go through onboarding
      redirect("/checkout");
    }
  }

  return (
    <DashboardChrome
      userEmail={user?.email || "Signed in"}
      isAdmin={isAdmin}
    >
      <div className="flex-1 w-full max-w-7xl mx-auto">
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
        {children}
      </div>
    </DashboardChrome>
  );
}
