import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  ChevronRight,
  Code2,
  FileText,
  Globe,
  Layers,
  LineChart,
  Lock,
  MessageSquareText,
  Palette,
  Rocket,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
  Users,
  Zap,
} from "lucide-react";

import { LiveDemoLauncher } from "@/components/landing/live-demo-launcher";
import { PricingSection } from "@/components/landing/pricing-section";
import { AnimatedCounter } from "@/components/landing/animated-counter";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/ui/logo";

type DemoClient = {
  slug: string;
  brandName: string;
};

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

    if (!candidate?.slug) return null;

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

  let isLoggedIn = false;
  let userEmail = "";
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      isLoggedIn = true;
      userEmail = user.email || "";
    }
  } catch {}

  return (
    <div className="min-h-screen bg-stone-950 text-white">
      {/* ══════════════════════════════════════════════
          HEADER — Floating glassmorphic nav
      ══════════════════════════════════════════════ */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          <nav className="flex h-14 items-center justify-between rounded-2xl border border-white/[0.06] bg-stone-950/70 px-5 backdrop-blur-xl">
            <Link
              href="/"
              className="flex items-center gap-2 transition-transform hover:scale-105"
            >
              <Logo tone="dark" size="sm" />
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              {["Features", "How It Works", "Demo", "Pricing"].map((item) => (
                <Link
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s/g, "-")}`}
                  className="rounded-xl px-3.5 py-1.5 text-sm font-medium text-stone-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {item}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {isLoggedIn ? (
                <Link
                  href="/clients"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-stone-950 transition hover:bg-stone-100"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-stone-950 text-[10px] font-bold text-white uppercase">
                    {userEmail ? userEmail[0] : <User className="h-3 w-3" />}
                  </div>
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hidden rounded-xl px-4 py-2 text-sm font-medium text-stone-400 transition hover:text-white sm:block"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-stone-950 transition hover:bg-stone-100"
                  >
                    Get Started
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main>
        {/* ══════════════════════════════════════════════
            HERO — Dark cinematic with orbs
        ══════════════════════════════════════════════ */}
        <section className="relative overflow-hidden pt-32 pb-24 lg:pt-44 lg:pb-32">
          {/* Background orbs */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute top-20 left-1/4 h-[500px] w-[500px] rounded-full bg-red-500/10 blur-[120px] animate-pulse-glow" />
            <div className="absolute top-40 right-1/4 h-[400px] w-[400px] rounded-full bg-orange-500/8 blur-[100px] animate-pulse-glow animation-delay-2000" />
            <div className="absolute -bottom-20 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-rose-500/6 blur-[140px] animate-pulse-glow animation-delay-4000" />
          </div>
          {/* Grid overlay */}
          <div className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-40" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              {/* Badge */}
              <div className="animate-fade-in-down inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-sm font-medium text-red-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
                </span>
                Now serving 2,000+ monthly conversations
              </div>

              {/* Headline */}
              <h1 className="mt-8 text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl animate-slide-up animation-delay-150">
                Your AI support bot.{" "}
                <span className="text-gradient">
                  Trained on your business.
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-stone-400 animate-slide-up animation-delay-300">
                NexusChat deploys a branded AI chatbot widget on your site —
                trained on your docs, styled to your brand, managed from your
                dashboard. No AI expertise needed.
              </p>

              {/* CTAs */}
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-slide-up animation-delay-450">
                <Link
                  href="/signup"
                  className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-xl bg-white px-6 text-sm font-semibold text-stone-950 transition-all hover:shadow-xl hover:shadow-white/10"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Start Free Trial
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
                <Link
                  href="#demo"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:border-white/20"
                >
                  <Sparkles className="h-4 w-4 text-red-400" />
                  View Live Demo
                </Link>
              </div>

              <p className="mt-4 text-xs text-stone-500 animate-slide-up animation-delay-600">
                7-day free trial on every plan. No credit card required.
              </p>
            </div>

            {/* ── Floating UI Preview Cards ── */}
            <div className="relative mx-auto mt-16 max-w-5xl animate-scale-in animation-delay-600">
              {/* Main mockup card */}
              <div className="relative rounded-2xl border border-white/[0.08] bg-stone-900/80 p-1 shadow-2xl backdrop-blur">
                <div className="rounded-xl bg-stone-950 p-6">
                  {/* Dashboard mockup header */}
                  <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-500/60" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                      <div className="h-3 w-3 rounded-full bg-green-500/60" />
                    </div>
                    <div className="flex-1 rounded-lg bg-white/5 px-4 py-1.5 text-xs text-stone-500 font-mono">
                      nexuschat.prateekhacks.in/dashboard
                    </div>
                  </div>
                  {/* Dashboard mockup content */}
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    {[
                      { label: "Active Bots", value: "3", color: "text-emerald-400" },
                      { label: "Conversations", value: "1,247", color: "text-blue-400" },
                      { label: "Messages", value: "18.4k", color: "text-purple-400" },
                      { label: "Leads", value: "89", color: "text-amber-400" },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                      >
                        <div className="text-xs text-stone-500">{stat.label}</div>
                        <div className={`mt-1 text-2xl font-semibold tracking-tight ${stat.color}`}>
                          {stat.value}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Conversation preview rows */}
                  <div className="mt-4 space-y-2">
                    {[
                      { visitor: "Sarah M.", msg: "How do I reset my password?", time: "2m ago", status: "bg-emerald-400" },
                      { visitor: "Mike D.", msg: "What are your pricing plans?", time: "5m ago", status: "bg-emerald-400" },
                      { visitor: "Anonymous", msg: "Do you offer enterprise plans?", time: "12m ago", status: "bg-stone-500" },
                    ].map((row) => (
                      <div
                        key={row.visitor}
                        className="flex items-center gap-3 rounded-lg bg-white/[0.02] px-4 py-3"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-xs font-semibold text-stone-400">
                          {row.visitor[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-stone-300">
                              {row.visitor}
                            </span>
                            <span className={`h-1.5 w-1.5 rounded-full ${row.status}`} />
                          </div>
                          <p className="truncate text-xs text-stone-500">
                            {row.msg}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-stone-600">
                          {row.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating chat widget card */}
              <div className="absolute -right-4 -bottom-8 w-[260px] animate-float rounded-2xl border border-white/[0.08] bg-stone-900 p-1 shadow-2xl sm:-right-12 lg:-right-16">
                <div className="rounded-xl overflow-hidden">
                  <div className="bg-red-500 px-4 py-3 flex items-center gap-2">
                    <Bot className="h-4 w-4 text-white" />
                    <span className="text-sm font-semibold text-white">
                      Support Bot
                    </span>
                    <span className="ml-auto h-2 w-2 rounded-full bg-white/60 animate-pulse" />
                  </div>
                  <div className="bg-stone-950 p-3 space-y-2">
                    <div className="max-w-[80%] rounded-xl rounded-bl-sm bg-white/10 px-3 py-2 text-xs text-stone-300">
                      Hi! How can I help you today?
                    </div>
                    <div className="ml-auto max-w-[80%] rounded-xl rounded-br-sm bg-red-500/80 px-3 py-2 text-xs text-white">
                      What&apos;s your refund policy?
                    </div>
                    <div className="max-w-[80%] rounded-xl rounded-bl-sm bg-white/10 px-3 py-2 text-xs text-stone-300">
                      We offer a 30-day money-back guarantee on all plans...
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating notification badge */}
              <div className="absolute -left-2 top-1/3 animate-float-delayed rounded-xl border border-white/[0.08] bg-stone-900 px-4 py-3 shadow-xl sm:-left-8 lg:-left-12">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
                    <Zap className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">New Lead!</div>
                    <div className="text-[10px] text-stone-500">sarah@acme.co</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            TRUST BAR — Scrolling social proof
        ══════════════════════════════════════════════ */}
        <section className="border-y border-white/[0.06] bg-stone-950/80 py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
              {[
                { icon: ShieldCheck, text: "SOC 2 Compliant Hosting" },
                { icon: Lock, text: "256-bit SSL Encryption" },
                { icon: Globe, text: "Global Edge Network" },
                { icon: Zap, text: "<2s AI Response Time" },
                { icon: Users, text: "Multi-Tenant Architecture" },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-2 text-sm text-stone-500"
                >
                  <Icon className="h-4 w-4 text-stone-600" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            FEATURES — Bento grid
        ══════════════════════════════════════════════ */}
        <section
          id="features"
          className="relative bg-white px-4 py-24 text-stone-950 sm:px-6 lg:px-8 lg:py-32"
        >
          <div className="pointer-events-none absolute inset-0 bg-dot-light" />
          <div className="relative mx-auto max-w-7xl">
            <ScrollReveal>
              <div className="mx-auto max-w-2xl text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-sm font-medium text-red-700">
                  <Layers className="h-3.5 w-3.5" />
                  Platform Features
                </div>
                <h2 className="mt-6 text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
                  Everything you need to{" "}
                  <span className="text-red-500">automate support</span>
                </h2>
                <p className="mt-4 text-lg leading-8 text-stone-600">
                  From training to deployment to analytics — one platform
                  handles it all.
                </p>
              </div>
            </ScrollReveal>

            {/* Bento Grid */}
            <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Large card spanning 2 cols */}
              <ScrollReveal delay={100} className="md:col-span-2 lg:col-span-2">
                <div className="group relative h-full overflow-hidden rounded-3xl border border-stone-200 bg-stone-50 p-8 transition-all duration-300 hover:border-red-200 hover:shadow-xl hover:shadow-red-500/5">
                  <div className="flex items-start justify-between">
                    <div className="max-w-md">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 transition-transform group-hover:scale-110">
                        <Brain className="h-6 w-6" />
                      </div>
                      <h3 className="mt-5 text-xl font-semibold tracking-tight text-stone-950">
                        RAG-Powered Knowledge Base
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-stone-600">
                        Upload PDFs, docs, and text files. We chunk, embed, and
                        index everything so your bot answers from your actual
                        business data — never hallucinated generic responses.
                      </p>
                      <div className="mt-6 flex flex-wrap gap-2">
                        {["PDF", "DOCX", "TXT", "CSV", "FAQ Pages"].map((t) => (
                          <span
                            key={t}
                            className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-600"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="hidden lg:block">
                      {/* Document stack illustration */}
                      <div className="relative w-48">
                        <div className="absolute top-0 right-0 h-32 w-40 rounded-xl border border-stone-200 bg-white p-3 shadow-sm rotate-3 transition-transform group-hover:rotate-6">
                          <div className="space-y-2">
                            <div className="h-2 w-3/4 rounded bg-stone-200" />
                            <div className="h-2 w-full rounded bg-stone-100" />
                            <div className="h-2 w-2/3 rounded bg-stone-100" />
                            <div className="h-2 w-5/6 rounded bg-stone-100" />
                          </div>
                        </div>
                        <div className="absolute top-2 right-4 h-32 w-40 rounded-xl border border-stone-200 bg-white p-3 shadow-sm -rotate-2 transition-transform group-hover:-rotate-4">
                          <div className="flex items-center gap-2 mb-3">
                            <FileText className="h-4 w-4 text-red-400" />
                            <div className="h-2 w-20 rounded bg-stone-200" />
                          </div>
                          <div className="space-y-1.5">
                            <div className="h-1.5 w-full rounded bg-stone-100" />
                            <div className="h-1.5 w-4/5 rounded bg-stone-100" />
                            <div className="h-1.5 w-full rounded bg-stone-100" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Regular feature cards */}
              {[
                {
                  icon: Palette,
                  title: "Brand Customization",
                  desc: "Match your brand colors, logo, welcome message, and tone of voice. Your bot looks and feels like part of your product.",
                  delay: 200,
                },
                {
                  icon: Code2,
                  title: "One-Line Embed",
                  desc: "Copy a single script tag and paste it into any website. The widget loads asynchronously and won't slow your page.",
                  delay: 300,
                },
                {
                  icon: LineChart,
                  title: "Analytics Dashboard",
                  desc: "Track conversations, resolution rates, message volume, token usage, and lead captures in real-time.",
                  delay: 150,
                },
                {
                  icon: Users,
                  title: "Lead Capture",
                  desc: "Automatically collect visitor emails before or during conversations. Leads sync to your dashboard instantly.",
                  delay: 250,
                },
                {
                  icon: ShieldCheck,
                  title: "Enterprise Security",
                  desc: "Domain-locked embeds, embed token validation, rate limiting, input sanitization, and encrypted data at rest.",
                  delay: 350,
                },
              ].map((feature) => (
                <ScrollReveal key={feature.title} delay={feature.delay}>
                  <div className="group h-full rounded-3xl border border-stone-200 bg-stone-50 p-6 transition-all duration-300 hover:border-red-200 hover:shadow-xl hover:shadow-red-500/5">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600 transition-transform group-hover:scale-110">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold tracking-tight text-stone-950">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-stone-600">
                      {feature.desc}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            HOW IT WORKS — Horizontal stepper
        ══════════════════════════════════════════════ */}
        <section
          id="how-it-works"
          className="relative overflow-hidden bg-stone-950 px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
        >
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
          <div className="relative mx-auto max-w-7xl">
            <ScrollReveal>
              <div className="mx-auto max-w-2xl text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-stone-300">
                  <Rocket className="h-3.5 w-3.5 text-red-400" />
                  How It Works
                </div>
                <h2 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Live in <span className="text-red-400">3 simple steps</span>
                </h2>
                <p className="mt-4 text-lg text-stone-400">
                  From signup to a live chatbot on your website in under 10
                  minutes.
                </p>
              </div>
            </ScrollReveal>

            <div className="mt-16 grid gap-8 lg:grid-cols-3">
              {[
                {
                  step: "01",
                  icon: Upload,
                  title: "Upload Your Knowledge",
                  desc: "Add your FAQs, product docs, policies, and support content. We automatically chunk, embed, and index everything into a vector knowledge base.",
                  details: [
                    "Drag & drop file uploads",
                    "PDF, DOCX, TXT, CSV support",
                    "Automatic chunking & embedding",
                    "Real-time processing status",
                  ],
                },
                {
                  step: "02",
                  icon: Sparkles,
                  title: "Customize Your Bot",
                  desc: "Set your brand colors, welcome message, suggested questions, tone of voice, and enable lead capture. Preview everything live before deploying.",
                  details: [
                    "Brand color & logo setup",
                    "Custom welcome message",
                    "Suggested conversation starters",
                    "Live widget preview",
                  ],
                },
                {
                  step: "03",
                  icon: Rocket,
                  title: "Embed & Go Live",
                  desc: "Copy one script tag, paste it into your website, and your AI support bot is live. Monitor conversations and leads from your dashboard.",
                  details: [
                    "Single script tag embed",
                    "Works on any website",
                    "Real-time analytics",
                    "In-app notifications",
                  ],
                },
              ].map((item, idx) => (
                <ScrollReveal
                  key={item.step}
                  delay={idx * 150}
                >
                  <div className="group relative h-full">
                    {/* Connecting line */}
                    {idx < 2 && (
                      <div className="absolute -right-4 top-14 hidden h-px w-8 bg-gradient-to-r from-white/20 to-transparent lg:block" />
                    )}

                    <div className="h-full rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 transition-all duration-300 hover:border-red-500/20 hover:bg-white/[0.04]">
                      {/* Step number */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-4xl font-bold text-white/[0.06] transition-colors group-hover:text-red-500/20">
                          {item.step}
                        </span>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 transition-transform group-hover:scale-110">
                          <item.icon className="h-5 w-5" />
                        </div>
                      </div>

                      <h3 className="mt-6 text-xl font-semibold tracking-tight text-white">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-stone-400">
                        {item.desc}
                      </p>

                      <div className="mt-6 space-y-2.5">
                        {item.details.map((d) => (
                          <div
                            key={d}
                            className="flex items-center gap-2.5"
                          >
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-red-400/60" />
                            <span className="text-sm text-stone-500">
                              {d}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            STATS — Animated counters
        ══════════════════════════════════════════════ */}
        <section className="border-y border-stone-200 bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  value: 2000,
                  suffix: "+",
                  label: "Messages handled monthly",
                  sublabel: "Across all client bots",
                },
                {
                  value: 95,
                  suffix: "%",
                  label: "Resolution rate",
                  sublabel: "Without human handoff",
                },
                {
                  value: 5,
                  suffix: " min",
                  label: "Setup time",
                  sublabel: "Upload docs to live bot",
                },
                {
                  value: 256,
                  suffix: "-bit",
                  label: "SSL encryption",
                  sublabel: "Enterprise-grade security",
                },
              ].map((stat, idx) => (
                <ScrollReveal key={stat.label} delay={idx * 100}>
                  <div className="text-center">
                    <div className="text-5xl font-semibold tracking-tight text-stone-950">
                      <AnimatedCounter
                        target={stat.value}
                        suffix={stat.suffix}
                      />
                    </div>
                    <div className="mt-2 text-sm font-semibold text-stone-900">
                      {stat.label}
                    </div>
                    <div className="mt-1 text-xs text-stone-500">
                      {stat.sublabel}
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            DEMO — Live widget demo
        ══════════════════════════════════════════════ */}
        <section
          id="demo"
          className="relative bg-stone-50 px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
        >
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-start">
              <ScrollReveal direction="right">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-sm font-medium text-red-700">
                    <Bot className="h-3.5 w-3.5" />
                    Live Demo
                  </div>
                  <h2 className="mt-6 text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
                    Try it right now.{" "}
                    <span className="text-red-500">No signup needed.</span>
                  </h2>
                  <p className="mt-4 text-lg leading-8 text-stone-600">
                    This loads the exact same embed widget your customers would
                    see. Ask it anything — it responds from real training data.
                  </p>

                  <div className="mt-8 space-y-4">
                    {[
                      {
                        icon: MessageSquareText,
                        title: "Real Conversations",
                        desc: "Test the actual AI chatbot — not a mockup",
                      },
                      {
                        icon: FileText,
                        title: "Knowledge-Grounded",
                        desc: "Answers come from uploaded documents via RAG",
                      },
                      {
                        icon: Zap,
                        title: "Sub-2 Second Response",
                        desc: "Groq-powered inference on Llama 3.3",
                      },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-4 transition-all hover:border-red-200 hover:shadow-sm"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                          <item.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-stone-900">
                            {item.title}
                          </h4>
                          <p className="mt-0.5 text-sm text-stone-500">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="left" delay={200}>
                {demoClient ? (
                  <LiveDemoLauncher
                    demoSlug={demoClient.slug}
                    brandName={demoClient.brandName}
                    hostUrl={hostUrl}
                  />
                ) : (
                  <div className="rounded-3xl border-2 border-dashed border-stone-300 bg-white p-10 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
                      <Bot className="h-7 w-7" />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold tracking-tight text-stone-950">
                      Demo coming soon
                    </h3>
                    <p className="mt-2 text-sm text-stone-500">
                      Create your first chatbot and it will automatically appear
                      here as a live demo.
                    </p>
                    <Link
                      href="/signup"
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800"
                    >
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            EMBED CODE PREVIEW — Show how easy it is
        ══════════════════════════════════════════════ */}
        <section className="bg-stone-950 px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <ScrollReveal>
              <div className="text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-stone-300">
                  <Code2 className="h-3.5 w-3.5 text-red-400" />
                  Integration
                </div>
                <h2 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  One line of code. That&apos;s it.
                </h2>
                <p className="mt-4 text-lg text-stone-400">
                  Paste this into your website and your AI chatbot is live.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="mt-12 overflow-hidden rounded-2xl border border-white/[0.08] bg-stone-900">
                {/* Code header */}
                <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/60" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                    <div className="h-3 w-3 rounded-full bg-green-500/60" />
                  </div>
                  <span className="text-xs text-stone-500 font-mono">
                    index.html
                  </span>
                </div>
                {/* Code body */}
                <div className="p-6">
                  <pre className="overflow-x-auto text-sm leading-7">
                    <code>
                      <span className="text-stone-600">
                        {"<!-- Add before closing </body> tag -->"}
                      </span>
                      {"\n"}
                      <span className="text-red-400">{"<script"}</span>
                      {"\n  "}
                      <span className="text-purple-400">src</span>
                      <span className="text-stone-500">=</span>
                      <span className="text-emerald-400">
                        {'"https://nexuschat.prateekhacks.in/embed.js"'}
                      </span>
                      {"\n  "}
                      <span className="text-purple-400">data-client</span>
                      <span className="text-stone-500">=</span>
                      <span className="text-emerald-400">
                        {'"your-bot-slug"'}
                      </span>
                      {"\n  "}
                      <span className="text-purple-400">defer</span>
                      {"\n"}
                      <span className="text-red-400">{"/>"}</span>
                    </code>
                  </pre>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Async Loading", desc: "Won't slow your site" },
                  { label: "Auto Updates", desc: "Always latest version" },
                  { label: "Any Framework", desc: "React, Vue, HTML, etc." },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center"
                  >
                    <div className="text-sm font-semibold text-white">
                      {item.label}
                    </div>
                    <div className="mt-0.5 text-xs text-stone-500">
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            PRICING
        ══════════════════════════════════════════════ */}
        <PricingSection />

        {/* ══════════════════════════════════════════════
            FINAL CTA
        ══════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-stone-950 px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-red-500/10 blur-[140px]" />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />

          <div className="relative mx-auto max-w-3xl text-center">
            <ScrollReveal>
              <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Ready to automate your
                <br />
                <span className="text-gradient">customer support?</span>
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg text-stone-400">
                Join businesses using NexusChat to handle support 24/7 with an
                AI bot trained on their own data.
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/signup"
                  className="group inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-white px-8 text-base font-semibold text-stone-950 shadow-xl shadow-white/10 transition-all hover:shadow-2xl hover:shadow-white/15"
                >
                  Start Your Free Trial
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="#demo"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/10 px-8 text-base font-semibold text-white transition hover:bg-white/5"
                >
                  See It In Action
                </Link>
              </div>
              <p className="mt-6 text-sm text-stone-500">
                Free 7-day trial on every plan. No credit card required. Cancel
                anytime.
              </p>
            </ScrollReveal>
          </div>
        </section>
      </main>

      {/* ══════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════ */}
      <footer className="border-t border-white/[0.06] bg-stone-950 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-2">
              <Logo tone="dark" size="md" />
              <p className="mt-4 max-w-xs text-sm leading-7 text-stone-500">
                AI-powered customer support chatbots, trained on your business
                data and deployed with a single line of code.
              </p>
              <div className="mt-6 flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-stone-500">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  All systems operational
                </div>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-sm font-semibold text-stone-300">
                Product
              </h4>
              <div className="mt-4 space-y-3">
                {[
                  { label: "Features", href: "#features" },
                  { label: "Pricing", href: "#pricing" },
                  { label: "Live Demo", href: "#demo" },
                  { label: "Dashboard", href: "/clients" },
                ].map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="block text-sm text-stone-500 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-stone-300">
                Legal
              </h4>
              <div className="mt-4 space-y-3">
                {[
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Service", href: "/terms" },
                ].map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="block text-sm text-stone-500 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-white/[0.06] pt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-stone-600">
              &copy; {new Date().getFullYear()} NexusChat. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-xs text-stone-600">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500/60" />
              Secured by 256-bit SSL encryption
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
