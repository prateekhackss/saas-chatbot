"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

export function DeleteAccountForm() {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"idle" | "confirm">("idle");

  const isConfirmed = confirmation === "DELETE MY ACCOUNT";

  async function handleDelete() {
    if (!isConfirmed) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "DELETE MY ACCOUNT" }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to delete account. Please try again.");
        setIsDeleting(false);
        return;
      }

      // Account deleted successfully — redirect to homepage
      router.push("/?deleted=true");
    } catch {
      setError("An unexpected error occurred. Please try again or contact support.");
      setIsDeleting(false);
    }
  }

  if (step === "idle") {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-stone-900">
              Delete Account
            </h3>
            <p className="mt-1 text-sm text-stone-500">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>
            <div className="mt-2 text-xs text-stone-400">
              This will permanently delete:
            </div>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-stone-400">
              <li>All your chatbot clients and their configurations</li>
              <li>All uploaded documents and training data</li>
              <li>All conversation histories and lead captures</li>
              <li>Active subscriptions (will be cancelled)</li>
              <li>Your user profile and authentication account</li>
            </ul>
            <button
              type="button"
              onClick={() => setStep("confirm")}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-500/20"
            >
              <Trash2 className="h-4 w-4" />
              I want to delete my account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15">
          <AlertTriangle className="h-5 w-5 text-red-500" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-red-600">
            Confirm Account Deletion
          </h3>
          <p className="mt-1 text-sm text-stone-500">
            This action is <strong className="text-red-600">permanent and irreversible</strong>.
            All your data, chatbots, documents, conversations, and subscriptions
            will be permanently destroyed.
          </p>

          <div className="mt-4">
            <label
              htmlFor="delete-confirmation"
              className="block text-sm font-medium text-stone-700"
            >
              Type{" "}
              <code className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-xs font-bold text-red-700">
                DELETE MY ACCOUNT
              </code>{" "}
              to confirm:
            </label>
            <input
              id="delete-confirmation"
              type="text"
              value={confirmation}
              onChange={(e) => {
                setConfirmation(e.target.value);
                setError(null);
              }}
              placeholder="DELETE MY ACCOUNT"
              autoComplete="off"
              spellCheck={false}
              disabled={isDeleting}
              className="mt-2 w-full max-w-sm rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-mono text-stone-900 placeholder:text-stone-300 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-50"
            />
          </div>

          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={!isConfirmed || isDeleting}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting Account...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Permanently Delete My Account
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("idle");
                setConfirmation("");
                setError(null);
              }}
              disabled={isDeleting}
              className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-600 transition hover:bg-stone-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
