"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, PlayCircle, Sparkles } from "lucide-react";

type LiveDemoLauncherProps = {
  demoSlug: string;
  brandName: string;
  hostUrl: string;
};

export function LiveDemoLauncher({
  demoSlug,
  brandName,
  hostUrl,
}: LiveDemoLauncherProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );

  const safeHostUrl = useMemo(() => hostUrl.replace(/\/$/, ""), [hostUrl]);
  const embedCode = useMemo(
    () => `<script src="${safeHostUrl}/embed.js" data-client="${demoSlug}"></script>`,
    [demoSlug, safeHostUrl],
  );

  function launchDemo() {
    const existingContainer = document.getElementById("nexuschat-widget-container");
    const existingScript = document.getElementById("nexuschat-demo-script");

    if (existingContainer || existingScript) {
      setStatus("ready");
      return;
    }

    setStatus("loading");

    const script = document.createElement("script");
    script.id = "nexuschat-demo-script";
    script.src = `${safeHostUrl}/embed.js`;
    script.async = true;
    script.setAttribute("data-client", demoSlug);
    script.onload = () => setStatus("ready");
    script.onerror = () => setStatus("error");

    document.body.appendChild(script);
  }

  return (
    <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-xl shadow-stone-200/70">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-stone-950">
            Try the live widget
          </h3>
          <p className="mt-1 text-sm text-stone-500">
            Load the real embed snippet for {brandName} and use the floating
            widget that appears in the bottom corner.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-stone-200 bg-stone-950 p-4">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">
          Embed Snippet
        </div>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-stone-100">
          {embedCode}
        </pre>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={launchDemo}
          disabled={status === "loading"}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-5 text-sm font-semibold text-white shadow-lg shadow-stone-950/15 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading Demo...
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4" />
              Launch Live Demo
            </>
          )}
        </button>

        <div className="text-sm text-stone-500">
          The widget loads exactly the way it does on a client website.
        </div>
      </div>

      <div
        className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
          status === "error"
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : "border-stone-200 bg-stone-50 text-stone-600"
        }`}
      >
        {status === "ready" ? (
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Demo loaded. Open the floating NexusChat widget in the bottom corner.
          </div>
        ) : status === "error" ? (
          "The demo widget could not be loaded. Check the active demo client slug or try again."
        ) : (
          "Use this section to trigger the production embed script without leaving the landing page."
        )}
      </div>
    </div>
  );
}
