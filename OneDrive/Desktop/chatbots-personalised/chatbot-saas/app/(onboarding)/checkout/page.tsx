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

  // Get the default client for this user (they just signed up, so they might not have one yet or they just got one created)
  const { data: clients } = await db
    .from("clients")
    .select("id, subscription_status")
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
  } else {
    // If they already have an active subscription, let them in
    if (["active", "trialing"].includes(clients[0].subscription_status)) {
       redirect("/clients");
    }
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
