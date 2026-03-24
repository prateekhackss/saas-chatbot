"use client";

import { useState } from "react";
import { format } from "date-fns";
import { 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  MessageSquareText, 
  XCircle,
  Loader2
} from "lucide-react";

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
};

type Conversation = {
  id: string;
  session_id: string;
  message_count: number;
  resolved: boolean;
  created_at: string;
  messages: Message[];
};

export default function ConversationList({ 
  initialConversations,
  clientId
}: { 
  initialConversations: Conversation[],
  clientId: string
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const toggleResolved = async (id: string, currentState: boolean) => {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/admin/conversations/${id}/resolve`, {
        method: 'PATCH'
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(prev => 
          prev.map(c => c.id === id ? { ...c, resolved: data.resolved } : c)
        );
      }
    } catch (e) {
      console.error("Failed to toggle resolve status:", e);
    } finally {
      setTogglingId(null);
    }
  };

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-[1.75rem] bg-white shadow-sm mt-6">
        <MessageSquareText className="h-10 w-10 text-stone-300 mb-4" />
        <h3 className="text-lg font-medium text-stone-900">No conversations yet</h3>
        <p className="text-stone-500 max-w-sm mt-1">
          When users interact with this chatbot, their transcripts will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-6">
      {conversations.map((conv) => {
        const isExpanded = expandedId === conv.id;
        const msgArray = Array.isArray(conv.messages) ? conv.messages : [];
        const firstMessage = msgArray.find(m => m.role === "user")?.content || "No user input recorded.";

        return (
          <div key={conv.id} className="border border-stone-200 bg-white rounded-2xl overflow-hidden shadow-sm transition-all">
            <div
              className={`p-3 sm:p-4 flex items-start sm:items-center justify-between cursor-pointer hover:bg-stone-50 transition gap-2 ${isExpanded ? 'bg-stone-50 border-b border-stone-100' : ''}`}
              onClick={() => setExpandedId(isExpanded ? null : conv.id)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-1 overflow-hidden min-w-0">
                <div className="shrink-0 flex items-center gap-2">
                  {conv.resolved ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[11px] font-medium text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Resolved</span>
                      <span className="sm:hidden">Done</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-medium text-amber-700">
                      <XCircle className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Needs Attention</span>
                      <span className="sm:hidden">Open</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-900 truncate">
                    {firstMessage}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-stone-500">
                    <span>{format(new Date(conv.created_at), "MMM d, yyyy h:mm a")}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{conv.message_count} messages</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 ml-2 sm:ml-4 flex items-center gap-2 text-stone-400 mt-1 sm:mt-0">
                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </div>

            {isExpanded && (
              <div className="bg-stone-50/50 p-4 sm:p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-2">
                  <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Transcript</h4>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleResolved(conv.id, conv.resolved);
                    }}
                    disabled={togglingId === conv.id}
                    className="text-xs font-medium bg-white border border-stone-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-stone-50 hover:text-stone-900 transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {togglingId === conv.id && <Loader2 className="h-3 w-3 animate-spin" />}
                    Mark as {conv.resolved ? "Unresolved" : "Resolved"}
                  </button>
                </div>
                
                {msgArray.length === 0 ? (
                  <p className="text-sm text-stone-500 italic">No messages stored in this record.</p>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 rounded-xl border border-stone-100 bg-white p-4 shadow-inner">
                    {msgArray.map((msg, idx) => (
                      <div key={idx} className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          msg.role === "user" 
                            ? "bg-stone-900 text-white rounded-br-sm" 
                            : "bg-stone-100 text-stone-800 rounded-bl-sm border border-stone-200"
                        }`}>
                          {msg.content}
                          
                          {/* Optional: if timestamp exists in legacy records */}
                          {msg.timestamp && (
                             <div className={`mt-1 text-[10px] ${msg.role === "user" ? "text-stone-400" : "text-stone-400"}`}>
                               {format(new Date(msg.timestamp), "h:mm a")}
                             </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
