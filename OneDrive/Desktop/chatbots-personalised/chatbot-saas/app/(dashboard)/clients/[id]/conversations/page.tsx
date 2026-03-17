import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ConversationList from "./client-list";

export default async function ConversationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const db = supabase as any;

  // Verify access
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: client } = await db
    .from("clients")
    .select("id, name, slug")
    .eq("id", id)
    .single();

  if (!client) redirect("/dashboard");

  // Fetch all conversations for this client
  const { data: conversations } = await db
    .from("conversations")
    .select("id, session_id, message_count, resolved, created_at, messages")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href={`/clients/${client.id}`}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-stone-200 text-stone-500 shadow-sm transition-all hover:bg-stone-50 hover:text-stone-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">
            Conversations
          </h1>
          <p className="text-stone-500">
            A full transcript log for <span className="font-semibold">{client.name}</span>.
          </p>
        </div>
      </div>

      <ConversationList 
        initialConversations={conversations || []} 
        clientId={client.id} 
      />
    </div>
  );
}
