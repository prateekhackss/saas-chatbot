"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/logo";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  card: ReactNode;
  footerPrompt: string;
  footerLinkHref: string;
  footerLinkLabel: string;
  accentLabel: string;
};

const highlights = [
  "Secure access for your internal chatbot operations team",
  "Tenant management, documents, and analytics in one workspace",
  "Supabase-backed sessions with protected dashboard routing",
];

export function AuthShell({
  eyebrow,
  title,
  description,
  card,
  footerPrompt,
  footerLinkHref,
  footerLinkLabel,
  accentLabel,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.08),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(10,10,10,0.12),_transparent_40%),linear-gradient(180deg,_#FAFAF9_0%,_#F5F5F4_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/60 bg-white/75 shadow-2xl shadow-neutral-900/10 backdrop-blur">
        <section className="relative hidden w-full flex-col justify-between overflow-hidden bg-[#0A0A0A] px-10 py-12 text-white lg:flex lg:max-w-[46%]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.25),_transparent_45%)]" />
          <div className="relative">
            <Logo size="md" showTagline={true} className="items-start" />
            <div className="mt-16 max-w-md space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#EF4444]/20 bg-[#EF4444]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#EF4444]">
                <Sparkles className="h-3.5 w-3.5" />
                {accentLabel}
              </div>
              <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
              <p className="text-base leading-7 text-neutral-300">{description}</p>
            </div>
          </div>

          <div className="relative space-y-3">
            {highlights.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#EF4444]" />
                <p className="text-sm leading-6 text-neutral-200">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 space-y-4">
              <div className="lg:hidden bg-[#0A0A0A] p-4 rounded-3xl mb-8 flex items-center justify-center">
                <Logo size="md" showTagline={true} />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-neutral-400">
                  {eyebrow}
                </p>
                <h2 className="text-3xl font-semibold tracking-tight text-neutral-950">
                  {title}
                </h2>
                <p className="text-sm leading-6 text-neutral-500">{description}</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-neutral-200/80 bg-white p-6 shadow-xl shadow-neutral-200/60 sm:p-8">
              {card}
            </div>

            <p className="mt-5 text-center text-sm text-neutral-500">
              {footerPrompt}{" "}
              <Link
                href={footerLinkHref}
                className="font-semibold text-neutral-950 transition hover:text-[#EF4444]"
              >
                {footerLinkLabel}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
