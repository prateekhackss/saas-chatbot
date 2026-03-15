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

  const { data: client, error } = await db
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !client) {
    redirect("/clients");
  }

  const { count: docCount } = await db
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("client_id", client.id);

  const { count: convoCount } = await db
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("client_id", client.id);

  const hostUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <ClientDetailPanel
      client={client}
      docCount={docCount || 0}
      convoCount={convoCount || 0}
      hostUrl={hostUrl}
    />
  );
}
