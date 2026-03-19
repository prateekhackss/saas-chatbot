import { Loader2, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export function AuthLoading() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.08),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(10,10,10,0.12),_transparent_40%),linear-gradient(180deg,_#FAFAF9_0%,_#F5F5F4_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/60 bg-white/75 shadow-2xl shadow-neutral-900/10 backdrop-blur">
        
        {/* Left Side (Dark branding skeleton) */}
        <section className="relative hidden w-full flex-col justify-between overflow-hidden bg-[#0A0A0A] px-10 py-12 text-white lg:flex lg:max-w-[46%] animate-pulse">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.25),_transparent_45%)]" />
          <div className="relative">
            <Logo size="md" showTagline={true} className="items-start opacity-75" />
            <div className="mt-16 max-w-md space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#EF4444]/20 bg-[#EF4444]/10 px-3 py-1 text-xs">
                <Sparkles className="h-3.5 w-3.5 text-[#EF4444]" />
                <div className="h-3 w-20 bg-[#EF4444]/20 rounded" />
              </div>
              <div className="space-y-3">
                <div className="h-8 w-3/4 bg-white/10 rounded" />
                <div className="h-8 w-1/2 bg-white/10 rounded" />
              </div>
              <div className="space-y-3 mt-6">
                <div className="h-4 w-full bg-white/5 rounded" />
                <div className="h-4 w-5/6 bg-white/5 rounded" />
              </div>
            </div>
          </div>
        </section>

        {/* Right Side (Form Area skeleton) */}
        <section className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md animate-pulse">
            <div className="mb-8 space-y-4">
              <div className="lg:hidden bg-[#0A0A0A] p-4 rounded-3xl mb-8 flex items-center justify-center opacity-75">
                 <Logo size="md" showTagline={true} />
              </div>
              <div className="space-y-3">
                <div className="h-3 w-24 bg-stone-200 rounded" />
                <div className="h-8 w-48 bg-stone-200 rounded" />
                <div className="h-4 w-full bg-stone-100 rounded" />
              </div>
            </div>

            <div className="rounded-[2rem] border border-neutral-200/80 bg-white p-6 shadow-xl shadow-neutral-200/60 sm:p-8 flex items-center justify-center h-64">
               <Loader2 className="h-8 w-8 animate-spin text-stone-300" />
            </div>

            <div className="mt-5 flex justify-center">
               <div className="h-4 w-48 bg-stone-100 rounded" />
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
