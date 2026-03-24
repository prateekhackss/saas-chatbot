import Link from "next/link";
import {
  ArrowRight,
  Bot,
  FileText,
  MessageSquareText,
  Plus,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DeleteClientButton } from "@/components/dashboard/delete-client-button";

type ClientRecord = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
};

type CountRecord = {
  client_id: string;
};

export default async function ClientsPage() {
  const supabase = await createClient();
  const db = supabase as any;

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await db
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .maybeSingle();
  const isAdmin = profile?.role === "admin";

  let clientsQuery = db
    .from("clients")
    .select("id, name, slug, is_active, created_at")
    .order("created_at", { ascending: false });
  if (!isAdmin && user) {
    clientsQuery = clientsQuery.eq("user_id", user.id);
  }

  const [
    { data: clientsData, error: clientsError },
    { data: documentsData, error: documentsError },
    { data: conversationsData, error: conversationsError },
  ] = await Promise.all([
    clientsQuery,
    db.from("documents").select("client_id"),
    db.from("conversations").select("client_id"),
  ]);

  if (clientsError || documentsError || conversationsError) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">
            Your Clients
          </h1>
          <p className="text-sm text-stone-500">
            We couldn&apos;t load your client workspace right now.
          </p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          Please refresh and try again. If the issue persists, check your
          Supabase connection settings.
        </div>
      </div>
    );
  }

  const clients = (clientsData || []) as ClientRecord[];
  const documents = (documentsData || []) as CountRecord[];
  const conversations = (conversationsData || []) as CountRecord[];

  const documentCounts = documents.reduce<Record<string, number>>((acc, record) => {
    acc[record.client_id] = (acc[record.client_id] || 0) + 1;
    return acc;
  }, {});

  const conversationCounts = conversations.reduce<Record<string, number>>(
    (acc, record) => {
      acc[record.client_id] = (acc[record.client_id] || 0) + 1;
      return acc;
    },
    {},
  );

  if (clients.length === 0) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center">
        <div className="w-full max-w-lg text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-red-500 to-rose-600 shadow-xl shadow-red-500/20">
            <Sparkles className="h-9 w-9 text-white" />
          </div>
          <h1 className="mt-8 text-3xl font-bold tracking-tight text-stone-950">
            No chatbots yet
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-stone-500">
            Your dashboard is ready. Create your first chatbot to start serving
            conversations and capturing leads.
          </p>
          <Link
            href="/clients/new"
            className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-6 text-sm font-semibold text-white shadow-lg shadow-stone-950/15 transition hover:bg-stone-800"
          >
            <Plus className="h-4 w-4" />
            Create your first chatbot
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
              Client Directory
            </p>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-950">
            Your Clients
          </h1>
          <p className="text-sm text-stone-500">
            Manage workspaces, review activity, and jump into operations.
          </p>
        </div>
        <Link
          href="/clients/new"
          className="group inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-5 text-sm font-semibold text-white shadow-lg shadow-stone-950/10 transition-all hover:bg-stone-800 hover:shadow-xl"
        >
          <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
          New Client
        </Link>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
          <p className="text-2xl font-bold tracking-tight text-stone-950">{clients.length}</p>
          <p className="text-xs text-stone-400">Total Clients</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
          <p className="text-2xl font-bold tracking-tight text-emerald-600">
            {clients.filter(c => c.is_active).length}
          </p>
          <p className="text-xs text-stone-400">Active</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
          <p className="text-2xl font-bold tracking-tight text-stone-400">
            {clients.filter(c => !c.is_active).length}
          </p>
          <p className="text-xs text-stone-400">Inactive</p>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="grid gap-4 md:hidden">
        {clients.map((client) => {
          const docCount = documentCounts[client.id] || 0;
          const conversationCount = conversationCounts[client.id] || 0;

          return (
            <div
              key={client.id}
              className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all hover:shadow-md"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold tracking-tight text-stone-950">
                      {client.name}
                    </h2>
                    <p className="mt-0.5 truncate text-xs font-mono text-stone-400">
                      {client.slug}
                    </p>
                  </div>
                  <StatusBadge isActive={client.is_active} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  <MetricTile
                    icon={<FileText className="h-3.5 w-3.5" />}
                    label="Docs"
                    value={docCount}
                  />
                  <MetricTile
                    icon={<MessageSquareText className="h-3.5 w-3.5" />}
                    label="Chats"
                    value={conversationCount}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-stone-100 bg-stone-50/60 px-5 py-3">
                <DeleteClientButton
                  clientId={client.id}
                  clientName={client.name}
                />
                <Link
                  href={`/clients/${client.id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-900 transition hover:text-red-600"
                >
                  Manage
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm md:block">
        <div className="border-b border-stone-100 bg-stone-50/60 px-6 py-3.5">
          <div className="grid grid-cols-[minmax(0,2.2fr)_1fr_100px_130px_200px] gap-4 text-[10px] font-bold uppercase tracking-[0.15em] text-stone-400">
            <span>Client</span>
            <span>Activity</span>
            <span>Status</span>
            <span>Created</span>
            <span className="text-right">Actions</span>
          </div>
        </div>
        <div className="divide-y divide-stone-50">
          {clients.map((client) => {
            const docCount = documentCounts[client.id] || 0;
            const conversationCount = conversationCounts[client.id] || 0;

            return (
              <div
                key={client.id}
                className="grid grid-cols-[minmax(0,2.2fr)_1fr_100px_130px_200px] items-center gap-4 px-6 py-4 transition-colors hover:bg-stone-50/60"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-stone-100 to-stone-200 text-stone-500">
                    <Bot className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-stone-950">
                      {client.name}
                    </h2>
                    <p className="truncate text-xs font-mono text-stone-400">
                      {client.slug}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-stone-500">
                  <span className="inline-flex items-center gap-1">
                    <FileText className="h-3 w-3 text-stone-400" />
                    {docCount}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageSquareText className="h-3 w-3 text-stone-400" />
                    {conversationCount}
                  </span>
                </div>

                <StatusBadge isActive={client.is_active} />

                <div className="text-xs text-stone-500">
                  {formatDate(client.created_at)}
                </div>

                <div className="flex items-center justify-end gap-2">
                  <DeleteClientButton
                    clientId={client.id}
                    clientName={client.name}
                  />
                  <Link
                    href={`/clients/${client.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 transition hover:border-stone-300 hover:text-stone-950"
                  >
                    Manage
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
        isActive
          ? "border-emerald-200 bg-emerald-50 text-emerald-600"
          : "border-stone-200 bg-stone-100 text-stone-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isActive ? "bg-emerald-500" : "bg-stone-400"
        }`}
      />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function MetricTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-stone-100 bg-stone-50 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-stone-400">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-1.5 text-lg font-bold tracking-tight text-stone-950">
        {value}
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
