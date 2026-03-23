"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, MessageSquareText, PlayCircle, Sparkles } from "lucide-react";

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

  // Auto-launch demo when component becomes visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && status === "idle") {
          launchDemo();
        }
      },
      { threshold: 0.3 }
    );

    const el = document.getElementById("demo-launcher-container");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

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
    <div
      id="demo-launcher-container"
      className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl"
    >
      {/* Header */}
      <div className="bg-gradient-to-br from-stone-950 to-stone-900 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15">
            <Sparkles className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              Live Widget Demo
            </h3>
            <p className="text-xs text-stone-400">
              Powered by {brandName}
            </p>
          </div>
          <div className="ml-auto">
            {status === "ready" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            ) : status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin text-stone-400" />
            ) : null}
          </div>
        </div>
      </div>

      {/* Demo Preview Area */}
      <div className="px-6 py-6">
        {status === "ready" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                Widget is live! Look for the <strong>chat bubble</strong> in the
                bottom-right corner of this page.
              </span>
            </div>

            <div className="rounded-xl bg-stone-50 border border-stone-100 p-4">
              <p className="text-sm font-medium text-stone-700">Try asking:</p>
              <div className="mt-3 space-y-2">
                {[
                  "What services do you offer?",
                  "How does pricing work?",
                  "Do you have a refund policy?",
                ].map((q) => (
                  <div
                    key={q}
                    className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-stone-600 border border-stone-100"
                  >
                    <MessageSquareText className="h-3.5 w-3.5 shrink-0 text-red-400" />
                    {q}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : status === "error" ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              Could not load the demo widget. Please try again.
            </div>
            <button
              type="button"
              onClick={launchDemo}
              className="inline-flex items-center gap-2 rounded-xl bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800"
            >
              <PlayCircle className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                {status === "loading" ? (
                  <>
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-red-400" />
                    <p className="mt-3 text-sm font-medium text-stone-700">
                      Loading live widget...
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      The real chatbot is being initialized
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 animate-bounce-subtle">
                      <MessageSquareText className="h-7 w-7" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-stone-700">
                      Scroll here to auto-launch the demo
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      Or click below to load it now
                    </p>
                    <button
                      type="button"
                      onClick={launchDemo}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800"
                    >
                      <PlayCircle className="h-4 w-4" />
                      Launch Demo
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
