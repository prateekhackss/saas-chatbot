"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, LockKeyhole, Mail, Wand2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { OAuthButtons } from "./oauth-buttons";
import { MagicLinkForm } from "./magic-link-form";

type LoginFormProps = {
  signupState?: string;
  signupEmail?: string;
};

export function LoginForm({ signupState, signupEmail }: LoginFormProps) {
  const router = useRouter();
  const isAuthConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showMagicLink, setShowMagicLink] = useState(false);

  const signupMessage =
    signupState === "check-email"
      ? `Account created. Check ${
          signupEmail ?? "your email"
        } for a confirmation link, then sign in.`
      : signupState === "confirmed"
        ? "Email confirmed. You can sign in to your dashboard now."
        : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isAuthConfigured) {
      setError(
        "Authentication is not configured for this deployment yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel, then redeploy.",
      );
      return;
    }

    setIsLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {signupMessage ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{signupMessage}</p>
        </div>
      ) : null}

      {!isAuthConfigured ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Authentication is not configured for this deployment yet. Add
            NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in
            your Vercel environment variables, then redeploy.
          </p>
        </div>
      ) : null}

      {/* OAuth Social Login */}
      <OAuthButtons />

      {/* Divider */}
      <div className="relative flex items-center gap-4">
        <div className="h-px flex-1 bg-stone-200" />
        <span className="text-xs font-medium uppercase tracking-widest text-stone-400">
          or continue with email
        </span>
        <div className="h-px flex-1 bg-stone-200" />
      </div>

      {/* Toggle: Magic Link vs Password */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setShowMagicLink(!showMagicLink)}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs font-medium text-stone-600 transition hover:border-stone-300 hover:text-stone-900"
        >
          <Wand2 className="h-3.5 w-3.5" />
          {showMagicLink ? "Use password instead" : "Email me a magic link"}
        </button>
      </div>

      {showMagicLink ? (
        <MagicLinkForm />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium tracking-tight text-stone-700"
            >
              Work email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className="h-12 w-full rounded-2xl border border-stone-200 bg-white pl-11 pr-4 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:ring-4 focus:ring-stone-200/60"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium tracking-tight text-stone-700"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-teal-600 transition hover:text-teal-700"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="h-12 w-full rounded-2xl border border-stone-200 bg-white pl-11 pr-4 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:ring-4 focus:ring-stone-200/60"
              />
            </div>
          </div>

          {error ? (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isLoading || !isAuthConfigured}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-stone-950 px-4 text-sm font-semibold text-white shadow-lg shadow-stone-950/15 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in to dashboard"
            )}
          </button>
        </form>
      )}

    </div>
  );
}
