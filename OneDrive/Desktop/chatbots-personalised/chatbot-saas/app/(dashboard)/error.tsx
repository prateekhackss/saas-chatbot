"use client";

import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center">
      <div className="w-full rounded-[2rem] border border-rose-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-950">
          Something went wrong in the dashboard
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          We could not finish loading this workspace. Try again to refresh the
          page state and reconnect to Supabase.
        </p>
        {error?.message ? (
          <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs text-slate-500">
            {error.message}
          </p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
