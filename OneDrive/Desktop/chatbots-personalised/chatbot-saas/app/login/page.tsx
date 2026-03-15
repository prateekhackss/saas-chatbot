import { Bot, ShieldCheck, Sparkles } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

const highlights = [
  "Secure access for your internal chatbot operations team",
  "Tenant management, documents, and analytics in one workspace",
  "Supabase-backed sessions with protected dashboard routing",
];

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.12),_transparent_40%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/60 bg-white/75 shadow-2xl shadow-slate-900/10 backdrop-blur">
        <section className="relative hidden w-full flex-col justify-between overflow-hidden bg-slate-950 px-10 py-12 text-white lg:flex lg:max-w-[46%]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.35),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.28),_transparent_45%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100">
              <Bot className="h-4 w-4 text-sky-300" />
              ChatbaseClone
            </div>
            <div className="mt-16 max-w-md space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
                <Sparkles className="h-3.5 w-3.5" />
                Admin Access
              </div>
              <h1 className="text-4xl font-semibold tracking-tight">
                Welcome back to your multi-tenant AI command center.
              </h1>
              <p className="text-base leading-7 text-slate-300">
                Monitor client workspaces, tune chatbot experiences, and keep
                every deployment under tight operational control.
              </p>
            </div>
          </div>

          <div className="relative space-y-3">
            {highlights.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                <p className="text-sm leading-6 text-slate-200">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 space-y-4">
              <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm lg:hidden">
                <Bot className="h-4 w-4 text-sky-600" />
                ChatbaseClone
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Sign in
                </p>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                  Access your dashboard
                </h2>
                <p className="text-sm leading-6 text-slate-500">
                  Use your Supabase admin credentials to open the client
                  management workspace.
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
              <LoginForm />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
