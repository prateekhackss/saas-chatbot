import { PricingSection } from "@/components/landing/pricing-section";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function OnboardingCheckoutPage() {
  const supabase = await createClient();
  const db = supabase as any;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check user-level subscription first (on profiles table)
  const { data: profile } = await db
    .from("profiles")
    .select("subscription_status, role")
    .eq("id", user.id)
    .maybeSingle();

  // If admin or already has active subscription, go to clients
  if (
    profile?.role === "admin" ||
    ["active", "trialing"].includes(profile?.subscription_status || "")
  ) {
    redirect("/clients");
  }

  // Get the default client for this user (needed to pass to pricing section for checkout)
  const { data: clients } = await db
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  let clientId = clients?.[0]?.id;

  // If the user doesn't have a default client workspace, create one automatically
  if (!clientId) {
    const { data: newClient } = await db.from("clients").insert({
      user_id: user.id,
      name: "My Workspace",
      slug: `workspace-${Date.now()}`,
    }).select("id").single();

    clientId = newClient?.id;
  }

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center">
      <div className="pt-12 text-center px-4 w-full">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          Secure Your Free Trial
        </h1>
        <p className="text-stone-400 max-w-md mx-auto">
          Add a payment method to start your 7-day free trial. We will automatically charge the card after 7 days, but you can cancel at any time.
        </p>
      </div>
      <div className="w-full">
         <PricingSection clientId={clientId} userEmail={user.email} />
      </div>
    </div>
  );
}
