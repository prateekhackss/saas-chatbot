import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Lock, Sparkles, ArrowRight } from "lucide-react";

export default async function NewClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const db = supabase as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user has an active subscription
  const { data: clients } = await db
    .from("clients")
    .select("id, subscription_status")
    .eq("user_id", user.id);

  const hasActiveSub = (clients || []).some((c: any) =>
    ["active", "trialing", "past_due"].includes(c.subscription_status)
  );

  // First-time user with no clients at all — allow them through (they'll create their first client after subscribing via checkout)
  // User with expired/cancelled clients — block them
  if (clients && clients.length > 0 && !hasActiveSub) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-stone-200 bg-white px-8 py-14 text-center shadow-xl shadow-stone-200/60">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <Lock className="h-8 w-8" />
          </div>

          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-stone-950">
            Subscription Required
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone-500">
            You need an active subscription plan to create new chatbots.
            Choose a plan to unlock chatbot creation, document uploads, and
            conversation management.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/checkout"
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-stone-950 px-6 text-sm font-semibold text-white shadow-lg shadow-stone-950/15 transition hover:bg-stone-800"
            >
              <Sparkles className="h-4 w-4" />
              View Plans & Subscribe
            </Link>
            <Link
              href="/clients"
              className="inline-flex h-12 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-6 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
            >
              Back to Clients
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
