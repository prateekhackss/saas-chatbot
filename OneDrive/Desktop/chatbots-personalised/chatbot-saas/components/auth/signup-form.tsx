"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, LockKeyhole, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const router = useRouter();
  const isAuthConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isAuthConfigured) {
      setError(
        "Authentication is not configured for this deployment yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel, then redeploy.",
      );
      return;
    }

    setIsLoading(true);

    const supabase = createClient();
    const emailRedirectTo =
      typeof window === "undefined"
        ? undefined
        : `${configuredAppUrl || window.location.origin}/auth/callback?next=/clients`;
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);

    if (data.session) {
      router.replace("/clients");
      router.refresh();
      return;
    }

    setSuccess("Account created. Redirecting you to sign in...");
    router.replace(`/login?signup=check-email&email=${encodeURIComponent(email)}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!isAuthConfigured ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Authentication is not configured for this deployment yet. Add
            `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in
            your Vercel environment variables, then redeploy.
          </p>
        </div>
      ) : null}

      {success ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{success}</p>
        </div>
      ) : null}

      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-sm font-medium tracking-tight text-stone-700"
        >
          Work email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -transtone-y-1/2 text-stone-400" />
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
        <label
          htmlFor="password"
          className="text-sm font-medium tracking-tight text-stone-700"
        >
          Password
        </label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -transtone-y-1/2 text-stone-400" />
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Create a password"
            className="h-12 w-full rounded-2xl border border-stone-200 bg-white pl-11 pr-4 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:ring-4 focus:ring-stone-200/60"
          />
        </div>
        <p className="text-xs text-stone-500">
          Use at least 8 characters for a secure dashboard password.
        </p>
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
            Creating account...
          </>
        ) : (
          "Create your account"
        )}
      </button>

      <p className="text-center text-sm text-stone-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-stone-950 transition hover:text-teal-700"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
