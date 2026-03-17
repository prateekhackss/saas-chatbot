import Link from "next/link";
import {
  ArrowRight,
  FileText,
  MessageSquareText,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

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

  const [
    { data: clientsData, error: clientsError },
    { data: documentsData, error: documentsError },
    { data: conversationsData, error: conversationsError },
  ] = await Promise.all([
    db
      .from("clients")
      .select("id, name, slug, is_active, created_at")
      .order("created_at", { ascending: false }),
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
        <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
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
        <div className="w-full rounded-[2rem] border border-stone-200 bg-white px-8 py-12 text-center shadow-xl shadow-stone-200/60">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-stone-950">
            No clients yet
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-stone-500">
            Your dashboard is ready. Create your first client to launch a new
            chatbot workspace, upload knowledge documents, and start serving
            conversations.
          </p>
          <Link
            href="/clients/new"
            className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-6 text-sm font-semibold text-white shadow-lg shadow-stone-950/15 transition hover:bg-stone-800"
          >
            <Plus className="h-4 w-4" />
            Create your first client
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-400">
            Client Directory
          </p>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-stone-950">
              Your Clients
            </h1>
            <p className="mt-2 text-sm text-stone-500">
              Manage tenant workspaces, review activity, and jump straight into
              operations.
            </p>
          </div>
        </div>
        <Link
          href="/clients/new"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-5 text-sm font-semibold text-white shadow-lg shadow-stone-950/15 transition hover:bg-stone-800"
        >
          <Plus className="h-4 w-4" />
          New Client
        </Link>
      </div>

      <div className="grid gap-4 md:hidden">
        {clients.map((client) => {
          const docCount = documentCounts[client.id] || 0;
          const conversationCount = conversationCounts[client.id] || 0;

          return (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm transition hover:-transtone-y-0.5 hover:border-stone-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold tracking-tight text-stone-950">
                    {client.name}
                  </h2>
                  <p className="mt-1 truncate text-sm text-stone-500">
                    {client.slug}
                  </p>
                </div>
                <StatusBadge isActive={client.is_active} />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <MetricTile
                  icon={<FileText className="h-4 w-4" />}
                  label="Documents"
                  value={docCount}
                />
                <MetricTile
                  icon={<MessageSquareText className="h-4 w-4" />}
                  label="Conversations"
                  value={conversationCount}
                />
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4 text-sm">
                <span className="text-stone-500">
                  Created {formatDate(client.created_at)}
                </span>
                <span className="inline-flex items-center gap-2 font-semibold text-stone-900">
                  Manage
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="hidden overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-sm md:block">
        <div className="border-b border-stone-200 bg-stone-50/80 px-6 py-4">
          <div className="grid grid-cols-[minmax(0,2.2fr)_1fr_110px_140px_160px] gap-4 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            <span>Client</span>
            <span>Activity</span>
            <span>Status</span>
            <span>Created</span>
            <span className="text-right">Action</span>
          </div>
        </div>
        <div className="divide-y divide-stone-100">
          {clients.map((client) => {
            const docCount = documentCounts[client.id] || 0;
            const conversationCount = conversationCounts[client.id] || 0;

            return (
              <div
                key={client.id}
                className="grid grid-cols-[minmax(0,2.2fr)_1fr_110px_140px_160px] items-center gap-4 px-6 py-5 transition hover:bg-stone-50/80"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-600">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold tracking-tight text-stone-950">
                        {client.name}
                      </h2>
                      <p className="truncate text-sm text-stone-500">
                        {client.slug}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-sm text-stone-600">
                  <div>{docCount} docs</div>
                  <div>{conversationCount} conversations</div>
                </div>

                <StatusBadge isActive={client.is_active} />

                <div className="text-sm text-stone-500">
                  {formatDate(client.created_at)}
                </div>

                <div className="text-right">
                  <Link
                    href={`/clients/${client.id}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-stone-900 transition hover:text-teal-700"
                  >
                    Manage
                    <ArrowRight className="h-4 w-4" />
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
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
        isActive
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-stone-200 bg-stone-100 text-stone-600"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
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
    <div className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3">
      <div className="flex items-center gap-2 text-stone-500">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="mt-2 text-lg font-semibold tracking-tight text-stone-950">
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
