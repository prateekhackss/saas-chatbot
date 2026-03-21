"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { LoginForm } from "./login-form";
import { SignupForm } from "./signup-form";

const highlights = [
  "Secure access for your internal chatbot operations team",
  "Tenant management, documents, and analytics in one workspace",
  "Supabase-backed sessions with protected dashboard routing",
];

export function AnimatedAuth({
  initialMode,
  signupState,
  signupEmail,
}: {
  initialMode: "login" | "signup";
  signupState?: string;
  signupEmail?: string;
}) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);

  // Sync mode when browser back/forward buttons are used
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const toggleMode = (newMode: "login" | "signup") => {
    setMode(newMode);
    window.history.pushState(null, "", `/${newMode}`);
  };

  const isLogin = mode === "login";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.08),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(10,10,10,0.12),_transparent_40%),linear-gradient(180deg,_#FAFAF9_0%,_#F5F5F4_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto relative flex min-h-[calc(100vh-5rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/60 bg-white/75 shadow-2xl shadow-neutral-900/10 backdrop-blur">
        
        {/* Dark Info Panel (Red portion that slides to right) */}
        <section 
          className={`absolute inset-y-0 z-20 hidden w-full flex-col justify-between overflow-hidden bg-[#0A0A0A] px-10 py-12 text-white lg:flex lg:w-[46%] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isLogin ? "lg:left-0 lg:translate-x-0" : "lg:left-0 lg:translate-x-[117.39%]" 
          }`}
          style={{ willChange: "transform" }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.25),_transparent_45%)]" />
          <div className="relative">
            <Logo size="md" showTagline={true} className="items-start" />
            
            <div className="relative mt-16 min-h-[12rem] w-full max-w-md">
              {/* Login Info fade */}
              <div className={`transition-all duration-500 absolute inset-0 ${isLogin ? 'opacity-100 translate-y-0 z-10 delay-150' : 'opacity-0 translate-y-4 -z-10'}`}>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#EF4444]/20 bg-[#EF4444]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#EF4444] mb-6">
                  <Sparkles className="h-3.5 w-3.5" />
                  Admin Access
                </div>
                <h1 className="text-4xl font-semibold tracking-tight mb-6">Access your dashboard</h1>
                <p className="text-base leading-7 text-neutral-300">Use your Supabase admin credentials to open the client management workspace.</p>
              </div>

              {/* Signup Info fade */}
              <div className={`transition-all duration-500 absolute inset-0 ${!isLogin ? 'opacity-100 translate-y-0 z-10 delay-150' : 'opacity-0 translate-y-4 -z-10'}`}>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#EF4444]/20 bg-[#EF4444]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#EF4444] mb-6">
                  <Sparkles className="h-3.5 w-3.5" />
                  New Account
                </div>
                <h1 className="text-4xl font-semibold tracking-tight mb-6">Create your dashboard account</h1>
                <p className="text-base leading-7 text-neutral-300">Start your 7-day free trial. Build your NexusChat workspace and manage branded AI deployments from one place.</p>
              </div>
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

        {/* Form Panel (White portion that slides left) */}
        <section 
          className={`absolute inset-y-0 z-10 flex w-full lg:w-[54%] items-center justify-center px-6 py-10 sm:px-10 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isLogin ? "left-0 lg:left-[46%] lg:translate-x-0" : "left-0 lg:left-[46%] lg:-translate-x-[85.18%]"
          }`}
          style={{ willChange: "transform" }}
        >
          <div className="w-full max-w-md relative min-h-[500px]">
            <div className="lg:hidden bg-[#0A0A0A] p-4 rounded-3xl mb-8 flex items-center justify-center">
              <Logo size="md" showTagline={true} />
            </div>

            {/* Login Form Container */}
            <div className={`transition-all duration-500 w-full ${isLogin ? 'opacity-100 scale-100 relative z-10 delay-150' : 'opacity-0 scale-95 pointer-events-none absolute inset-0'}`}>
              <div className="mb-8 space-y-4">
                <div className="space-y-2 lg:hidden">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-neutral-400">Sign in</p>
                  <h2 className="text-3xl font-semibold tracking-tight text-neutral-950">Access your dashboard</h2>
                  <p className="text-sm leading-6 text-neutral-500">Use your Supabase admin credentials to open the client management workspace.</p>
                </div>
              </div>
              <div className="rounded-[2rem] border border-neutral-200/80 bg-white p-6 shadow-xl shadow-neutral-200/60 sm:p-8">
                <LoginForm signupState={signupState} signupEmail={signupEmail} />
              </div>
              <p className="mt-5 text-center text-sm text-neutral-500">
                Need an account?{" "}
                <button
                  type="button"
                  onClick={() => toggleMode("signup")}
                  className="font-semibold text-neutral-950 transition hover:text-[#EF4444] focus:outline-none"
                >
                  Create one
                </button>
              </p>
            </div>

            {/* Signup Form Container */}
            <div className={`transition-all duration-500 w-full ${!isLogin ? 'opacity-100 scale-100 relative z-10 delay-150' : 'opacity-0 scale-95 pointer-events-none absolute inset-0'}`}>
              <div className="mb-8 space-y-4">
                <div className="space-y-2 lg:hidden">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-neutral-400">Sign up</p>
                  <h2 className="text-3xl font-semibold tracking-tight text-neutral-950">Create your dashboard account</h2>
                  <p className="text-sm leading-6 text-neutral-500">Start your NexusChat workspace, create client portals, and manage branded AI deployments from one place.</p>
                </div>
              </div>
              <div className="rounded-[2rem] border border-neutral-200/80 bg-white p-6 shadow-xl shadow-neutral-200/60 sm:p-8">
                <SignupForm />
              </div>
              <p className="mt-5 text-center text-sm text-neutral-500">
                Already have access?{" "}
                <button
                  type="button"
                  onClick={() => toggleMode("login")}
                  className="font-semibold text-neutral-950 transition hover:text-[#EF4444] focus:outline-none"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
