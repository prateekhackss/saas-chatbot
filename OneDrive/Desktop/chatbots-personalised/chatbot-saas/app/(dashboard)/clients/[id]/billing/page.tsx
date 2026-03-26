import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PricingSection } from "@/components/landing/pricing-section";

export default async function ClientBillingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const db = supabase as any;

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Fetch client info
  const { data: client, error } = await db
    .from("clients")
    .select("id, name, plan_tier, subscription_status")
    .eq("id", id)
    .single();

  if (error || !client) {
    redirect("/clients");
  }

  // Fetch user profile (source of truth for plan_tier)
  const { data: profile } = await db
    .from("profiles")
    .select("plan_tier, subscription_status")
    .eq("id", user.id)
    .maybeSingle();

  // Use profile plan_tier as source of truth, fall back to client
  const activePlanTier = profile?.plan_tier || client.plan_tier || "starter";
  const activeSubStatus = profile?.subscription_status || client.subscription_status || "incomplete";

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-stone-950">
          Billing & Plans
        </h1>
        <p className="mt-2 text-stone-500">
          Manage your subscription for <strong>{client.name}</strong>.
        </p>
      </div>

      <div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold tracking-tight text-stone-950">
          Current Plan: <span className="capitalize">{activePlanTier}</span>
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Status: <span className="capitalize font-medium text-stone-700">{activeSubStatus}</span>
        </p>
      </div>

      {/* Reusing the landing page pricing cards with LemonSqueezy checkout */}
      <div className="-mx-4 sm:-mx-4 lg:-mx-6 border-none mt-8 overflow-hidden">
        <PricingSection clientId={client.id} userEmail={user.email} currentPlan={activePlanTier} />
      </div>
    </div>
  );
}
