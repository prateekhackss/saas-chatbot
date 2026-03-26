"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  Mail,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { OAuthButtons } from "./oauth-buttons";

export function SignupForm() {
  const router = useRouter();
  const isAuthConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Password strength checks
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const allChecksPassed = Object.values(passwordChecks).every(Boolean);

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

    if (password.length > 0 && !allChecksPassed) {
      setError(
        "Password must be at least 8 characters with one uppercase, one lowercase, and one number.",
      );
      return;
    }

    setIsLoading(true);

    const supabase = createClient();
    const emailRedirectTo =
      typeof window === "undefined"
        ? undefined
        : `${configuredAppUrl || window.location.origin}/auth/callback?next=/dashboard`;
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          full_name: fullName.trim(),
          company_name: companyName.trim(),
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);

    if (data.session) {
      // Email confirmation is OFF — user is immediately authenticated
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setSuccess("Account created. Redirecting you to sign in...");
    router.replace(`/login?signup=check-email&email=${encodeURIComponent(email)}`);
    router.refresh();
  }

  return (
    <div className="space-y-5">
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

      {success ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{success}</p>
        </div>
      ) : null}

      {/* OAuth Social Login */}
      <OAuthButtons />

      {/* Divider */}
      <div className="relative flex items-center gap-4">
        <div className="h-px flex-1 bg-stone-200" />
        <span className="text-xs font-medium uppercase tracking-widest text-stone-400">
          or sign up with email
        </span>
        <div className="h-px flex-1 bg-stone-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name & Company Name */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="full-name"
              className="text-sm font-medium tracking-tight text-stone-700"
            >
              Full name
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                id="full-name"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Prateek Patel"
                className="h-12 w-full rounded-2xl border border-stone-200 bg-white pl-11 pr-4 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:ring-4 focus:ring-stone-200/60"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="company-name"
              className="text-sm font-medium tracking-tight text-stone-700"
            >
              Company name
            </label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                id="company-name"
                type="text"
                autoComplete="organization"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="NexusChat Inc."
                className="h-12 w-full rounded-2xl border border-stone-200 bg-white pl-11 pr-4 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:ring-4 focus:ring-stone-200/60"
              />
            </div>
          </div>
        </div>

        {/* Email */}
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

        {/* Password */}
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium tracking-tight text-stone-700"
          >
            Password
          </label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
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

          {/* Password strength indicators */}
          {password.length > 0 && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { key: "length" as const, label: "8+ characters" },
                { key: "uppercase" as const, label: "Uppercase letter" },
                { key: "lowercase" as const, label: "Lowercase letter" },
                { key: "number" as const, label: "Number" },
              ].map(({ key, label }) => (
                <div
                  key={key}
                  className={`flex items-center gap-1.5 text-xs transition ${
                    passwordChecks[key]
                      ? "text-emerald-600"
                      : "text-stone-400"
                  }`}
                >
                  <div
                    className={`h-1.5 w-1.5 rounded-full transition ${
                      passwordChecks[key] ? "bg-emerald-500" : "bg-stone-300"
                    }`}
                  />
                  {label}
                </div>
              ))}
            </div>
          )}
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
      </form>

    </div>
  );
}
