import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#FAFAF9_0%,_#FFFFFF_36%,_#F5F5F4_100%)] flex flex-col">
      <header className="border-b border-white/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105">
            <Logo tone="light" size="md" />
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="animate-fade-in-up">
          <div className="text-8xl font-bold tracking-tight text-stone-200 sm:text-9xl">404</div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-stone-950 sm:text-4xl">
            Page not found
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-stone-500">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-stone-950 px-5 text-sm font-semibold text-white transition hover:bg-stone-800"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Link>
            <Link
              href="/clients"
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
