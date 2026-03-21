"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { useRouter } from "next/navigation";

const pricingPlans = [
  {
    name: "Starter",
    planId: "starter",
    monthlyPrice: 29,
    annualPrice: 290,
    description:
      "Perfect for a single-product business looking to automate basic support.",
    features: [
      "1 Custom Chatbot",
      "2,000 messages/month",
      "Train on up to 20 documents",
      "Basic widget branding",
      "7-day chat history retention",
      "Email support (48hr response)",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    planId: "pro",
    monthlyPrice: 59,
    annualPrice: 590,
    description:
      "The targeted growth plan with advanced analytics and integrations.",
    features: [
      "3 Custom Chatbots",
      "10,000 messages/month",
      "Train on up to 100 documents",
      "Remove branding & custom widget colors",
      "Lead capture & human handoff alerts",
      "Slack integration & analytics",
    ],
    highlighted: true,
  },
  {
    name: "Business",
    planId: "business",
    monthlyPrice: 99,
    annualPrice: 990,
    description:
      "For agencies and high-volume teams requiring white-label control.",
    features: [
      "10 Custom Chatbots",
      "50,000 messages/month",
      "Unlimited training documents",
      "White-label branding (no branding)",
      "Full API access & custom domains",
      "Priority support & onboarding call",
    ],
    highlighted: false,
  },
];

export function PricingSection({ clientId, userEmail, currentPlan }: { clientId?: string; userEmail?: string; currentPlan?: string }) {
  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { pushToast } = useToast();
  const router = useRouter();

  const handleCheckout = async (plan: any) => {
    if (!clientId) {
      router.push("/signup");
      return;
    }

    setLoadingPlan(plan.name);

    try {
      // 1. Create LemonSqueezy Checkout
      const res = await fetch("/api/billing/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.planId + (isAnnual ? "_annual" : "_monthly"),
          clientId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create checkout");

      // 2. Redirect to LemonSqueezy hosted checkout page
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL received");
      }

    } catch (error: any) {
      pushToast({ title: "Checkout Error", description: error.message, variant: "error" });
      setLoadingPlan(null);
    }
  };

  return (
    <section
      id="pricing"
      className="border-t border-stone-200 bg-stone-950 px-4 py-24 text-white sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-400">
              Pricing
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">
              Simple, transparent pricing that scales with you.
            </h2>
            <p className="mt-4 text-lg leading-8 text-stone-300">
              Start with a 7-day free trial on any plan. Cancel anytime before the trial ends to avoid being charged.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-stone-800 bg-stone-900/50 p-1.5 shrink-0 self-start md:self-auto">
            <button
              onClick={() => setIsAnnual(false)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                !isAnnual
                  ? "bg-stone-800 text-white shadow-sm"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`relative rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                isAnnual
                  ? "bg-stone-800 text-white shadow-sm"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              Annually
              <span className="absolute -right-2 -top-3 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xl shadow-rose-500/30">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-[2rem] border p-6 shadow-xl transition-all duration-300 hover:scale-[1.02] sm:p-8 ${
                plan.highlighted
                  ? "border-rose-400 bg-white text-stone-950"
                  : "border-stone-800 bg-stone-900 text-white"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-0 right-0 mx-auto w-max animate-pulse rounded-full bg-rose-100 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-rose-900 shadow-sm">
                  Most Popular
                </div>
              )}

              <div className="flex items-start justify-between gap-4 mt-2">
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight">
                    {plan.name}
                  </h3>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-6xl font-semibold tracking-tight">
                      ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                    </span>
                    <span
                      className={`text-sm ${
                        plan.highlighted ? "text-stone-500" : "text-stone-400"
                      }`}
                    >
                      /{isAnnual ? "year" : "month"}
                    </span>
                  </div>
                </div>
              </div>

              <p
                className={`mt-6 text-sm leading-7 ${
                  plan.highlighted ? "text-stone-600" : "text-stone-300"
                }`}
              >
                {plan.description}
              </p>

              <div className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <CheckCircle2
                      className={`mt-0.5 h-5 w-5 shrink-0 ${
                        plan.highlighted ? "text-rose-600" : "text-rose-400"
                      }`}
                    />
                    <span
                      className={`text-sm leading-6 ${
                        plan.highlighted ? "text-stone-700" : "text-stone-200"
                      }`}
                    >
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {currentPlan?.toLowerCase() === plan.planId.toLowerCase() ? (
                <div
                  className={`mt-10 inline-flex h-12 w-full items-center justify-center rounded-2xl text-sm font-semibold border-2 ${
                    plan.highlighted
                      ? "border-rose-400 text-rose-600 bg-rose-50"
                      : "border-emerald-400 text-emerald-400 bg-emerald-400/10"
                  }`}
                >
                  ✓ Current Plan
                </div>
              ) : (
                <button
                  onClick={() => handleCheckout(plan)}
                  disabled={loadingPlan === plan.name}
                  className={`mt-10 inline-flex h-12 w-full gap-2 items-center justify-center rounded-2xl text-sm font-semibold transition ${
                    plan.highlighted
                      ? "bg-stone-950 text-white shadow-xl shadow-stone-950/20 hover:bg-stone-800 disabled:bg-stone-800"
                      : "bg-white text-stone-950 hover:bg-stone-100 disabled:opacity-75"
                  }`}
                >
                  {loadingPlan === plan.name ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {clientId ? "Upgrade Plan" : "Start 7-Day Free Trial"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
