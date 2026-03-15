import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Copy, Bot, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const db = supabase as any;

  // 1. Fetch Client Data
  const { data: client, error } = await db
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !client) {
    redirect('/clients');
  }

  // 2. Fetch Aggregated Data
  const { count: docCount } = await db
    .from('documents')
    .select('id', { count: 'exact' })
    .eq('client_id', client.id);

  const { count: convoCount } = await db
    .from('conversations')
    .select('id', { count: 'exact' })
    .eq('client_id', client.id);

  const hostUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const embedCode = `<script src="${hostUrl}/embed.js" data-client="${client.slug}"></script>`;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{client.name}</h2>
          <div className="flex items-center gap-2 mt-2">
             <span className="text-gray-500">slug: {client.slug}</span>
             <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${client.is_active ? 'bg-black text-white' : 'bg-gray-100 text-gray-900'}`}>
                {client.is_active ? 'Active' : 'Inactive'}
             </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Knowledge Base</h3>
          </div>
          <div>
            <div className="text-2xl font-bold">{docCount || 0} Docs</div>
            <Link href={`/clients/${client.id}/documents`} className="text-xs text-blue-600 hover:underline mt-1 block">
              Manage Documents →
            </Link>
          </div>
        </div>
        
        <div className="rounded-xl border bg-white shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Conversations</h3>
          </div>
          <div>
            <div className="text-2xl font-bold">{convoCount || 0}</div>
            <Link href={`/clients/${client.id}/analytics`} className="text-xs text-blue-600 hover:underline mt-1 block">
              View Chat Logs →
            </Link>
          </div>
        </div>
      </div>

      {/* Two Column Layout for Config and Preview */}
      <div className="grid gap-6 md:grid-cols-2">
         {/* Config Viewer */}
         <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
           <div className="p-6 pb-4">
             <h3 className="text-lg font-semibold leading-none tracking-tight">Branding Configuration</h3>
             <p className="text-sm text-gray-500 mt-2">The visual and behavioral settings for the widget.</p>
           </div>
           <div className="p-6 pt-0 space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <span className="text-xs font-semibold uppercase text-gray-500 block mb-1">Primary Color</span>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border shadow-sm" style={{ backgroundColor: client.config.primaryColor }}></div>
                    <code className="text-sm">{client.config.primaryColor}</code>
                  </div>
               </div>
               <div>
                  <span className="text-xs font-semibold uppercase text-gray-500 block mb-1">Tone</span>
                  <div className="text-sm capitalize">{client.config.tone}</div>
               </div>
             </div>
             
             <div>
               <span className="text-xs font-semibold uppercase text-gray-500 block mb-1">Fallback Message</span>
               <div className="text-sm bg-gray-50 p-3 rounded-md border">{client.config.fallbackMessage}</div>
             </div>

             <div className="pt-4 border-t">
                <span className="text-xs font-semibold uppercase text-gray-500 block mb-2">Embed Code</span>
                <div className="relative">
                   <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                      {embedCode}
                   </pre>
                </div>
             </div>
           </div>
         </div>

         {/* Live Preview Iframe */}
         <div className="rounded-xl border bg-white shadow-xl flex flex-col overflow-hidden h-[600px] relative">
            <div className="absolute inset-0 z-0 bg-slate-100 flex items-center justify-center">
               <span className="text-slate-400 font-medium">Loading Preview...</span>
            </div>
            
            {/* 
              We load the actual standalone widget inside an iframe 
              to guarantee 100% visual fidelity to the production environment!
            */}
            <iframe 
               src={`${hostUrl}/widget/${client.slug}`}
               className="w-full h-full relative z-10 border-0 pointer-events-auto"
               title={`${client.name} Chatbot Preview`}
            />
         </div>
      </div>
    </div>
  );
}
