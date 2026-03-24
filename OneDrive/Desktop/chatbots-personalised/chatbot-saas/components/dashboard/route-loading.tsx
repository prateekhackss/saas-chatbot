import { Loader2 } from "lucide-react";

type RouteLoadingProps = {
  title: string;
  description: string;
};

export function RouteLoading({ title, description }: RouteLoadingProps) {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-stone-200" />
          <div className="h-3 w-20 animate-pulse rounded-full bg-stone-200" />
        </div>
        <div className="h-9 w-56 animate-pulse rounded-xl bg-stone-200" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded-full bg-stone-100" />
      </div>

      {/* Loading indicator */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100">
            <Loader2 className="h-4 w-4 animate-spin text-stone-400" />
          </div>
          <div>
            <span className="text-sm font-medium text-stone-700">{title}</span>
            <p className="text-xs text-stone-400">{description}</p>
          </div>
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <div className="h-3 w-24 animate-pulse rounded-full bg-stone-200" />
                <div className="h-8 w-16 animate-pulse rounded-lg bg-stone-200" />
                <div className="h-3 w-32 animate-pulse rounded-full bg-stone-100" />
              </div>
              <div className="h-10 w-10 animate-pulse rounded-xl bg-stone-100" />
            </div>
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-stone-100 bg-stone-50/60 px-6 py-3">
          <div className="h-3 w-40 animate-pulse rounded-full bg-stone-200" />
        </div>
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-b border-stone-50 px-6 py-4"
          >
            <div className="h-9 w-9 animate-pulse rounded-xl bg-stone-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-36 animate-pulse rounded-full bg-stone-200" />
              <div className="h-3 w-24 animate-pulse rounded-full bg-stone-100" />
            </div>
            <div className="h-6 w-16 animate-pulse rounded-full bg-stone-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
