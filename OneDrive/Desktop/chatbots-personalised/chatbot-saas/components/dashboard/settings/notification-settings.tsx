"use client";

import { useState } from "react";
import { Loader2, Check, Save, Lock } from "lucide-react";
import Link from "next/link";
import type { PlanTier } from "@/lib/constants/pricing";

type NotificationPrefs = {
  newLead: boolean;
  newConversation: boolean;
  usageAlert: boolean;
  weeklyDigest: boolean;
};

export function NotificationSettings({
  initial,
  planTier = "starter",
}: {
  initial: NotificationPrefs;
  planTier?: PlanTier;
}) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges = JSON.stringify(prefs) !== JSON.stringify(initial);

  function toggle(key: keyof NotificationPrefs) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave() {
    if (!hasChanges) return;
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifications: prefs }),
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

  const options: {
    key: keyof NotificationPrefs;
    label: string;
    description: string;
    minPlan?: PlanTier;
  }[] = [
    {
      key: "newLead",
      label: "New Lead Captured",
      description: "Get notified when a visitor submits their contact details",
    },
    {
      key: "newConversation",
      label: "New Conversation Started",
      description: "Alert when a new chat session begins with a visitor",
    },
    {
      key: "usageAlert",
      label: "Usage Limit Warnings",
      description: "Notify when approaching your monthly message limit (80%+)",
    },
    {
      key: "weeklyDigest",
      label: "Weekly Digest",
      description: "Summary of conversations, leads, and usage sent every Monday",
      minPlan: "pro",
    },
  ];

  const PLAN_RANK: Record<PlanTier, number> = {
    starter: 0,
    pro: 1,
    business: 2,
  };

  return (
    <div className="space-y-3">
      {options.map((opt) => {
        const isLocked =
          opt.minPlan !== undefined &&
          PLAN_RANK[planTier] < PLAN_RANK[opt.minPlan];

        return (
          <div
            key={opt.key}
            className={`flex items-center justify-between rounded-xl border p-4 ${
              isLocked
                ? "border-stone-100 bg-stone-50/60 opacity-75"
                : "border-stone-100 bg-stone-50"
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-stone-900">
                  {opt.label}
                </span>
                {isLocked && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                    <Lock className="h-2.5 w-2.5" />
                    Pro
                  </span>
                )}
              </div>
              <div className="text-xs text-stone-400">
                {isLocked
                  ? "Upgrade to Pro or Business to enable this notification"
                  : opt.description}
              </div>
            </div>

            {isLocked ? (
              <Link
                href="/checkout?upgrade=true"
                className="shrink-0 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-stone-600 transition hover:bg-stone-50 hover:text-stone-900"
              >
                Upgrade
              </Link>
            ) : (
              <button
                type="button"
                role="switch"
                aria-checked={prefs[opt.key]}
                onClick={() => toggle(opt.key)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-stone-300 focus:ring-offset-2 ${
                  prefs[opt.key] ? "bg-emerald-500" : "bg-stone-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                    prefs[opt.key] ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            )}
          </div>
        );
      })}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="inline-flex items-center gap-2 rounded-xl bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isSaving ? "Saving..." : saved ? "Saved!" : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}
