import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  MessageSquareText,
  Rocket,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
  Zap,
} from "lucide-react";

import { LiveDemoLauncher } from "@/components/landing/live-demo-launcher";
import { PricingSection } from "@/components/landing/pricing-section";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/ui/logo";

type DemoClient = {
  slug: string;
  brandName: string;
};

const implementationSteps = [
  {
    title: "Upload your knowledge",
    description:
      "Add FAQs, product info, policies, and support content so the assistant only answers from your business data.",
    icon: Upload,
  },
  {
    title: "We tune the assistant",
    description:
      "Brand colors, welcome copy, fallback behavior, and suggested prompts are configured for a polished launch.",
    icon: Sparkles,
  },
  {
    title: "Embed in minutes",
    description:
      "Paste one script tag onto your website and the live widget is ready for visitors, leads, and support questions.",
    icon: Rocket,
  },
];



async function getDemoClient(): Promise<DemoClient | null> {
  try {
    const admin = createAdminClient() as any;

    const { data: activeClient } = await admin
      .from("clients")
      .select("slug, name, config")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const candidate =
      activeClient ||
      (
        await admin
          .from("clients")
          .select("slug, name, config")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      ).data;

    if (!candidate?.slug) {
      return null;
    }

    return {
      slug: candidate.slug,
      brandName: candidate.config?.brandName || candidate.name,
    };
  } catch (error) {
    console.error("Unable to load demo client:", error);
    return null;
  }
}

export async function MarketingLandingPage() {
  const demoClient = await getDemoClient();
  const hostUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Check if user is logged in
  let isLoggedIn = false;
  let userEmail = "";
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      isLoggedIn = true;
      userEmail = user.email || "";
    }
  } catch {
    // Not logged in
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#FAFAF9_0%,_#FFFFFF_36%,_#F5F5F4_100%)] text-stone-950">
      <header className="sticky top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105">
            <Logo tone="light" size="md" />
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-stone-600 md:flex">
            <Link href="#features" className="transition hover:text-stone-950">
              Features
            </Link>
            <Link href="#demo" className="transition hover:text-stone-950">
              Demo
            </Link>
            <Link href="#pricing" className="transition hover:text-stone-950">
              Pricing
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/clients"
                className="inline-flex items-center gap-2 rounded-2xl bg-stone-950 px-4 h-10 text-sm font-semibold text-white transition hover:bg-stone-800"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold uppercase">
                  {userEmail ? userEmail[0] : <User className="h-3.5 w-3.5" />}
                </div>
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-stone-600 transition hover:text-stone-950"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex h-10 items-center justify-center rounded-2xl bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-4 pb-24 pt-20 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem]">
            <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-[140%] rounded-full bg-rose-200/30 blur-3xl animate-blob" />
            <div className="absolute left-1/2 top-10 h-96 w-96 -translate-x-[5%] rounded-full bg-stone-200/20 blur-3xl animate-blob animation-delay-2000" />
            <div className="absolute right-[12%] top-16 h-80 w-80 rounded-full bg-red-200/25 blur-3xl animate-blob animation-delay-4000" />
          </div>

          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:items-start">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-900 animate-fade-in-down">
                <Sparkles className="h-4 w-4 text-rose-500 animate-pulse" />
                Premium AI chatbot setup for modern support teams
              </div>
              <h1 className="mt-8 text-5xl font-semibold tracking-tight text-stone-950 sm:text-6xl lg:text-7xl animate-fade-in-up animation-delay-150">
                Deploy a branded support bot that feels like part of your business.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600 animate-fade-in-up animation-delay-300">
                NexusChat gives you a polished AI support widget trained on your
                actual business knowledge, with onboarding, embed setup, and a
                dashboard your team can manage without touching the AI backend.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row animate-fade-in-up animation-delay-450">
                <Link
                  href="/signup"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-6 text-sm font-semibold text-white shadow-lg shadow-stone-950/15 transition hover:bg-stone-800"
                >
                  Start 7-Day Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#demo"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-stone-200 bg-white px-6 text-sm font-semibold text-stone-900 transition hover:border-stone-300 hover:bg-stone-50"
                >
                  View Live Demo
                </Link>
              </div>
              <p className="mt-4 text-sm font-medium text-stone-500 animate-fade-in-up animation-delay-450">
                No credit card required. Cancel anytime.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-6 animate-fade-in-up animation-delay-500">
                <div className="flex items-center gap-2 text-sm text-stone-500">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Payments secured by Stripe
                </div>
                <div className="flex items-center gap-2 text-sm text-stone-500">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-100 text-[10px] font-bold text-stone-600 border border-stone-200">
                    P
                  </div>
                  Built by an AI engineer, not a corp
                </div>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3 animate-fade-in-up animation-delay-450">
                <MetricCard value="<2s Response" label="Lightning-fast AI inference" />
                <MetricCard
                  value="5m Training"
                  label="Upload docs and deploy instantly"
                />
                <MetricCard
                  value="256-bit SSL"
                  label="Enterprise-grade data encryption"
                />
              </div>
            </div>

            <div className="rounded-[2rem] border border-stone-200/80 bg-white/90 p-6 shadow-2xl shadow-stone-200/80 backdrop-blur animate-fade-in-left animation-delay-450">
              <div className="rounded-[1.75rem] bg-stone-950 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-400">
                      Why teams choose NexusChat
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                      A setup-first offer that actually matches your service model.
                    </h2>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                    <Zap className="h-5 w-5 text-rose-400 animate-bounce-subtle" />
                  </div>
                </div>
                <div className="mt-8 space-y-4">
                  <ValuePill text="Launch with your own colors, copy, and tone" />
                  <ValuePill text="Use the dashboard to update docs, analytics, and embeds later" />
                  <ValuePill text="Keep answers grounded with your RAG knowledge base" />
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <FeaturePanel
                  icon={<MessageSquareText className="h-5 w-5" />}
                  title="Support coverage"
                  description="Handle FAQs, pricing questions, onboarding prompts, and product guidance instantly."
                />
                <FeaturePanel
                  icon={<ShieldCheck className="h-5 w-5" />}
                  title="Operational control"
                  description="Protected dashboard access, live previews, document uploads, and conversation analytics."
                />
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="border-y border-stone-200/70 bg-white px-4 py-24 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-700">
                How it works
              </p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">
                A polished delivery flow from uploaded docs to live customer support.
              </h2>
              <p className="mt-4 text-lg leading-8 text-stone-600">
                Instead of a generic template, NexusChat is built to help you
                onboard real client accounts, train their assistants, and hand
                off a deployment-ready widget with confidence.
              </p>
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {implementationSteps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <div
                    key={step.title}
                    className="rounded-[2rem] border border-stone-200 bg-stone-50 p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:bg-white hover:shadow-xl animate-fade-in-up"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 transition hover:scale-110">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-6 text-xl font-semibold tracking-tight text-stone-950">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-stone-600">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="demo" className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-700">
                  Live demo
                </p>
                <h2 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">
                  Test the real embedded widget before you sell it.
                </h2>
                <p className="mt-4 text-lg leading-8 text-stone-600">
                  This section loads the exact `embed.js` file used on client
                  websites, so you can verify the floating launcher, iframe
                  experience, and first-run behavior on the same page prospects visit.
                </p>
              </div>

              <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold tracking-tight text-stone-950">
                  Why it matters
                </h3>
                <div className="mt-5 space-y-4">
                  <Bullet text="The demo proves the embed flow works without requiring prospects to imagine the final experience." />
                  <Bullet text="You can use the same landing page during sales calls, launch reviews, and client onboarding." />
                  <Bullet text="If no demo client exists yet, create one in the dashboard and this section becomes your public showcase." />
                </div>
              </div>
            </div>

            {demoClient ? (
              <LiveDemoLauncher
                demoSlug={demoClient.slug}
                brandName={demoClient.brandName}
                hostUrl={hostUrl}
              />
            ) : (
              <div className="rounded-[2rem] border border-dashed border-stone-300 bg-white p-8 shadow-sm">
                <h3 className="text-xl font-semibold tracking-tight text-stone-950">
                  Demo client not configured yet
                </h3>
                <p className="mt-3 text-sm leading-7 text-stone-600">
                  Create your first active client in the dashboard and this section
                  will automatically use it as the live embed demo for visitors.
                </p>
                <Link
                  href="/signup"
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-stone-950 px-5 text-sm font-semibold text-white transition hover:bg-stone-800"
                >
                  Create an account to set up a demo
                </Link>
              </div>
            )}
          </div>
        </section>

        <PricingSection />
      </main>

      <footer className="border-t border-stone-200 bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Logo tone="light" size="md" />
          </div>
          <p className="text-sm text-stone-500">
            Copyright {new Date().getFullYear()} NexusChat. AI chatbots trained on
            your business content and ready to deploy.
          </p>
        </div>
      </footer>
    </div>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.5rem] border border-stone-200 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
      <div className="text-base font-semibold tracking-tight text-stone-950">{value}</div>
      <div className="mt-1 text-sm leading-6 text-stone-500">{label}</div>
    </div>
  );
}

function FeaturePanel({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-stone-700 shadow-sm">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-tight text-stone-950">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
    </div>
  );
}

function ValuePill({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <CheckCircle2 className="h-5 w-5 shrink-0 text-rose-400" />
      <span className="text-sm leading-6 text-stone-200">{text}</span>
    </div>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" />
      <span className="text-sm leading-7 text-stone-600">{text}</span>
    </div>
  );
}
