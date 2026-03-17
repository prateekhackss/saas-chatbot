import { Loader2 } from "lucide-react";

type RouteLoadingProps = {
  title: string;
  description: string;
};

export function RouteLoading({ title, description }: RouteLoadingProps) {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-28 animate-pulse rounded-full bg-stone-200" />
        <div className="h-10 w-72 animate-pulse rounded-2xl bg-stone-200" />
        <div className="h-4 w-[26rem] max-w-full animate-pulse rounded-full bg-stone-100" />
      </div>

      <div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 text-stone-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <p className="mt-2 text-sm text-stone-500">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm"
          >
            <div className="h-4 w-28 animate-pulse rounded-full bg-stone-200" />
            <div className="mt-5 h-8 w-24 animate-pulse rounded-2xl bg-stone-200" />
            <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-stone-100" />
            <div className="mt-2 h-4 w-3/4 animate-pulse rounded-full bg-stone-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
