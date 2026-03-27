import { ClientDetailPanel } from "@/components/clients/client-detail-panel";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const db = supabase as any;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: client, error } = await db
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !client) {
    redirect("/clients");
  }

  // Fetch user profile plan_tier (source of truth)
  const { data: profile } = await db
    .from("profiles")
    .select("plan_tier")
    .eq("id", user.id)
    .maybeSingle();

  const { count: docCount } = await db
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("client_id", client.id);

  const { count: convoCount } = await db
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("client_id", client.id);

  const hostUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Override client plan_tier with profile (source of truth)
  const clientWithPlan = {
    ...client,
    plan_tier: profile?.plan_tier || client.plan_tier || "starter",
  };

  return (
    <ClientDetailPanel
      client={clientWithPlan}
      docCount={docCount || 0}
      convoCount={convoCount || 0}
      hostUrl={hostUrl}
    />
  );
}
