import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus, FileDown } from "lucide-react";
import { format } from "date-fns";

export default async function LeadsPage({
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

  // Fetch all leads for this client
  const { data: leads } = await db
    .from("leads")
    .select("id, name, email, captured_at, session_id")
    .eq("client_id", client.id)
    .order("captured_at", { ascending: false });

  const totalLeads = leads?.length || 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href={`/clients/${client.id}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white border border-stone-200 text-stone-500 shadow-sm transition-all hover:bg-stone-50 hover:text-stone-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex flex-col gap-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              Generated Leads
            </h1>
            <p className="text-stone-500 text-sm truncate">
              Collected via <span className="font-semibold">{client.name}</span> widget.
            </p>
          </div>
        </div>

        {totalLeads > 0 && (
          <form action="/api/admin/analytics/export" method="GET" className="shrink-0">
             <input type="hidden" name="clientId" value={client.id} />
             <input type="hidden" name="type" value="leads" />
             <input type="hidden" name="format" value="csv" />
             <button
               type="submit"
               className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-teal-700"
             >
               <FileDown className="h-4 w-4" />
               Export CSV
             </button>
          </form>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mt-6">
        <div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2 text-stone-500 font-medium">
               <UserPlus className="h-5 w-5 text-blue-600" />
               Total Leads
            </div>
            <div className="text-4xl font-bold text-stone-900">{totalLeads}</div>
        </div>
      </div>

      <div className="bg-white border border-stone-200 shadow-sm rounded-3xl overflow-hidden mt-6">
        {totalLeads === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
            <UserPlus className="h-10 w-10 text-stone-300 mb-4" />
            <h3 className="text-lg font-medium text-stone-900">No leads captured yet</h3>
            <p className="text-stone-500 max-w-sm mt-1">
              Once users leave their email addresses via the offline or lead generation forms, they will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="divide-y divide-stone-100 md:hidden">
              {leads?.map((lead: { id: string, name: string | null, email: string, captured_at: string, session_id: string }) => (
                <div key={lead.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-stone-900 truncate">
                        {lead.name || <span className="text-stone-400 italic">Not provided</span>}
                      </p>
                      <p className="text-sm font-mono text-stone-600 truncate">{lead.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>{format(new Date(lead.captured_at), "MMM d, yyyy h:mm a")}</span>
                    <span className="font-mono text-stone-400">{lead.session_id.slice(0, 8)}...</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-stone-50/50 text-xs text-stone-500 uppercase font-semibold border-b border-stone-100">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email Address</th>
                    <th className="px-6 py-4">Date Captured</th>
                    <th className="px-6 py-4">Conversion Session</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100/80">
                  {leads?.map((lead: { id: string, name: string | null, email: string, captured_at: string, session_id: string }) => (
                     <tr key={lead.id} className="hover:bg-stone-50/50 transition">
                       <td className="px-6 py-4 font-medium text-stone-900">{lead.name || <span className="text-stone-400 italic">Not provided</span>}</td>
                       <td className="px-6 py-4 font-mono text-stone-700">{lead.email}</td>
                       <td className="px-6 py-4 text-stone-600">{format(new Date(lead.captured_at), "MMM d, yyyy h:mm a")}</td>
                       <td className="px-6 py-4 font-mono text-xs text-stone-400">{lead.session_id.slice(0, 10)}...</td>
                     </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
