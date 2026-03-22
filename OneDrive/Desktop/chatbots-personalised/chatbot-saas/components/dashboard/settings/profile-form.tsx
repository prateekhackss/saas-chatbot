"use client";

import { useState } from "react";
import { Loader2, Save, Check } from "lucide-react";

type ProfileFormProps = {
  initialName: string;
  initialCompany: string;
  initialTimezone: string;
};

const TIMEZONES = [
  { value: "", label: "Select timezone..." },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time" },
  { value: "Pacific/Honolulu", label: "Hawaii Time" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Central Europe (CET)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Tokyo", label: "Japan (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "Pacific/Auckland", label: "New Zealand (NZST)" },
];

export function ProfileForm({
  initialName,
  initialCompany,
  initialTimezone,
}: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [company, setCompany] = useState(initialCompany);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges =
    name !== initialName ||
    company !== initialCompany ||
    timezone !== initialTimezone;

  async function handleSave() {
    if (!hasChanges || !name.trim()) return;
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: name.trim(),
          company_name: company.trim(),
          timezone,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="full_name"
            className="block text-xs font-medium uppercase tracking-[0.15em] text-stone-400"
          >
            Full Name *
          </label>
          <input
            id="full_name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-300 transition focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200"
          />
        </div>
        <div>
          <label
            htmlFor="company_name"
            className="block text-xs font-medium uppercase tracking-[0.15em] text-stone-400"
          >
            Company Name
          </label>
          <input
            id="company_name"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Acme Inc."
            className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-300 transition focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="timezone"
          className="block text-xs font-medium uppercase tracking-[0.15em] text-stone-400"
        >
          Timezone
        </label>
        <select
          id="timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="mt-1.5 w-full max-w-xs rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 transition focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || !name.trim() || isSaving}
          className="inline-flex items-center gap-2 rounded-xl bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isSaving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
        {!hasChanges && (
          <span className="text-xs text-stone-400">No changes to save</span>
        )}
      </div>
    </div>
  );
}
