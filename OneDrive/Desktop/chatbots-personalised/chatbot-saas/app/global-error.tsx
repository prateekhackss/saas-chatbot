"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4 text-center">
        <div className="text-7xl font-bold tracking-tight text-stone-200">500</div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-stone-950">
          Something went wrong
        </h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-stone-500">
          An unexpected error occurred. Our team has been notified. Please try again.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex h-10 items-center rounded-2xl bg-stone-950 px-5 text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            Try Again
          </button>
          <a
            href="/"
            className="inline-flex h-10 items-center rounded-2xl border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
          >
            Go Home
          </a>
        </div>
        {error.digest && (
          <p className="mt-6 font-mono text-xs text-stone-400">
            Error ID: {error.digest}
          </p>
        )}
      </body>
    </html>
  );
}
