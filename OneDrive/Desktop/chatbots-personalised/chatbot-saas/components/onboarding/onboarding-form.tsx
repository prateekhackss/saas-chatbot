"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Building2, Globe, Loader2 } from "lucide-react";

export function OnboardingForm({
  defaultName,
  userEmail,
}: {
  defaultName: string;
  userEmail: string;
}) {
  const router = useRouter();
  const [orgName, setOrgName] = useState(defaultName);
  const [slug, setSlug] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from org name
  function handleNameChange(value: string) {
    setOrgName(value);
    const generated = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 48);
    setSlug(generated);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedName = orgName.trim();
    const trimmedSlug = slug.trim();

    if (!trimmedName) {
      setError("Organization name is required.");
      return;
    }

    if (!trimmedSlug || !/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(trimmedSlug)) {
      setError(
        "Slug must be lowercase letters, numbers, and hyphens. Must start and end with a letter or number."
      );
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, slug: trimmedSlug }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create workspace.");
        setIsLoading(false);
        return;
      }

      // Success — redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-neutral-800 bg-[#111111] p-6 shadow-xl"
    >
      <div className="space-y-5">
        {/* Signed in as */}
        <div className="rounded-xl bg-neutral-900/50 px-4 py-3">
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500">
            Signed in as
          </div>
          <div className="mt-1 text-sm text-neutral-300">{userEmail}</div>
        </div>

        {/* Organization Name */}
        <div className="space-y-2">
          <label
            htmlFor="org-name"
            className="text-sm font-medium tracking-tight text-neutral-300"
          >
            Organization name
          </label>
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              id="org-name"
              type="text"
              required
              value={orgName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Acme Inc."
              className="h-12 w-full rounded-2xl border border-neutral-700 bg-neutral-900 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-neutral-500 focus:ring-4 focus:ring-neutral-800/60"
            />
          </div>
        </div>

        {/* Workspace Slug */}
        <div className="space-y-2">
          <label
            htmlFor="slug"
            className="text-sm font-medium tracking-tight text-neutral-300"
          >
            Workspace URL
          </label>
          <div className="relative">
            <Globe className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              id="slug"
              type="text"
              required
              value={slug}
              onChange={(e) =>
                setSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "")
                    .slice(0, 48)
                )
              }
              placeholder="acme-inc"
              className="h-12 w-full rounded-2xl border border-neutral-700 bg-neutral-900 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-neutral-500 focus:ring-4 focus:ring-neutral-800/60"
            />
          </div>
          <p className="text-xs text-neutral-500">
            nexuschat.com/<span className="text-neutral-400">{slug || "your-workspace"}</span>
          </p>
        </div>

        {/* Error */}
        {error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#EF4444] to-[#DC2626] px-4 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:from-[#DC2626] hover:to-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating workspace...
            </>
          ) : (
            "Create workspace"
          )}
        </button>
      </div>
    </form>
  );
}
