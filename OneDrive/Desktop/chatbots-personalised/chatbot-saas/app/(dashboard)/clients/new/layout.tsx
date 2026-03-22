import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Lock, Sparkles, ArrowRight, AlertTriangle } from "lucide-react";
import { PLAN_LIMITS, PlanTier } from "@/lib/constants/pricing";

export default async function NewClientLayout({
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

  // Check user profile for role + user-level subscription
  const { data: profile } = await db
    .from("profiles")
    .select("role, subscription_status, plan_tier")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = profile?.role === "admin";

  // Admins can always create clients
  if (isAdmin) {
    return <>{children}</>;
  }

  // User-level subscription check (survives client deletion)
  const hasActiveSub = ["active", "trialing", "past_due"].includes(
    profile?.subscription_status || ""
  );

  // If user has no active subscription — show paywall
  if (!hasActiveSub) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-stone-200 bg-white px-8 py-14 text-center shadow-xl shadow-stone-200/60">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <Lock className="h-8 w-8" />
          </div>

          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-stone-950">
            Subscription Required
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone-500">
            You need an active subscription plan to create new chatbots.
            Choose a plan to unlock chatbot creation, document uploads, and
            conversation management.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/checkout"
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-stone-950 px-6 text-sm font-semibold text-white shadow-lg shadow-stone-950/15 transition hover:bg-stone-800"
            >
              <Sparkles className="h-4 w-4" />
              View Plans & Subscribe
            </Link>
            <Link
              href="/clients"
              className="inline-flex h-12 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-6 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
            >
              Back to Clients
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // User has active subscription — enforce bot count limit
  const planTier = (profile?.plan_tier || "starter") as PlanTier;
  const maxBots = PLAN_LIMITS[planTier].maxBots;

  const { count: currentBotCount } = await db
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_active", true);

  if ((currentBotCount || 0) >= maxBots) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-stone-200 bg-white px-8 py-14 text-center shadow-xl shadow-stone-200/60">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-stone-950">
            Bot Limit Reached
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone-500">
            Your <span className="font-semibold capitalize">{planTier}</span> plan
            allows up to <span className="font-semibold">{maxBots}</span>{" "}
            {maxBots === 1 ? "chatbot" : "chatbots"}. You currently have{" "}
            <span className="font-semibold">{currentBotCount}</span> active.
            Upgrade your plan to create more.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/checkout?upgrade=true"
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-stone-950 px-6 text-sm font-semibold text-white shadow-lg shadow-stone-950/15 transition hover:bg-stone-800"
            >
              <Sparkles className="h-4 w-4" />
              Upgrade Plan
            </Link>
            <Link
              href="/clients"
              className="inline-flex h-12 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-6 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
            >
              Back to Clients
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
