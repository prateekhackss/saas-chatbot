import { PricingSection } from "@/components/landing/pricing-section";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function OnboardingCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ upgrade?: string }>;
}) {
  const supabase = await createClient();
  const db = supabase as any;
  const { data: { user } } = await supabase.auth.getUser();
  const { upgrade } = await searchParams;

  if (!user) {
    redirect("/login");
  }

  // Check user-level subscription first (on profiles table)
  const { data: profile } = await db
    .from("profiles")
    .select("subscription_status, plan_tier, role")
    .eq("id", user.id)
    .maybeSingle();

  const isActive = ["active", "trialing"].includes(profile?.subscription_status || "");
  const isUpgrade = upgrade === "true";

  // If admin, go to clients (admins don't need checkout)
  if (profile?.role === "admin") {
    redirect("/clients");
  }

  // If already subscribed and NOT upgrading, redirect to clients
  if (isActive && !isUpgrade) {
    redirect("/clients");
  }

  // Get user's first client if they have one (optional — used for redirect after checkout)
  const { data: clients } = await db
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  const clientId = clients?.[0]?.id || null;

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center">
      <div className="pt-12 text-center px-4 w-full">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          {isUpgrade ? "Upgrade Your Plan" : "Secure Your Free Trial"}
        </h1>
        <p className="text-stone-400 max-w-md mx-auto">
          {isUpgrade
            ? `You're currently on the ${profile?.plan_tier || "starter"} plan. Choose a higher plan to unlock more bots, messages, and features.`
            : "Add a payment method to start your 7-day free trial. We will automatically charge the card after 7 days, but you can cancel at any time."}
        </p>
      </div>
      <div className="w-full">
         <PricingSection clientId={clientId} userEmail={user.email} currentPlan={isActive ? (profile?.plan_tier || undefined) : undefined} />
      </div>
    </div>
  );
}
