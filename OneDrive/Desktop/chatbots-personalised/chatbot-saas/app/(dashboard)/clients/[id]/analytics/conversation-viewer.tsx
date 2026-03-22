"use client";

import { useState } from "react";
import { ChevronDown, User, Bot, Mail } from "lucide-react";

type Message = {
  role?: string;
  content?: string;
  timestamp?: string;
};

type EnrichedConversation = {
  id: string;
  session_id: string;
  created_at: string;
  messages: Message[];
  resolved: boolean;
  estimated_tokens: number;
  visitorLabel: string;
  visitorEmail: string | null;
};

export function ConversationViewer({
  conversations,
}: {
  conversations: EnrichedConversation[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="divide-y divide-stone-100">
      {conversations.map((conversation) => {
        const isExpanded = expandedId === conversation.id;
        const lastUserMsg = getLatestUserMessage(conversation.messages);

        return (
          <div key={conversation.id}>
            {/* Row Header — clickable */}
            <button
              onClick={() => toggle(conversation.id)}
              className="w-full text-left px-6 py-5 transition hover:bg-stone-50/80 focus:outline-none"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* Visitor avatar */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-100">
                    <User className="h-4 w-4 text-stone-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-stone-900 truncate">
                        {conversation.visitorLabel}
                      </span>
                      {conversation.visitorEmail && (
                        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                          <Mail className="h-2.5 w-2.5" />
                          Lead
                        </span>
                      )}
                      <StatusPill resolved={conversation.resolved} />
                    </div>
                    <p className="mt-0.5 text-xs text-stone-500 truncate">
                      {lastUserMsg}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="hidden sm:flex flex-col items-end gap-0.5">
                    <span className="text-xs font-medium text-stone-700">
                      {conversation.messages.length} messages
                    </span>
                    <span className="text-[11px] text-stone-400">
                      {formatDate(conversation.created_at)}
                    </span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-stone-400 transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>
            </button>

            {/* Expanded Chat Transcript */}
            {isExpanded && (
              <div className="border-t border-stone-100 bg-stone-50/50 px-6 py-4">
                {/* Visitor info header */}
                {conversation.visitorEmail && (
                  <div className="mb-4 flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-xs text-blue-700">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="font-medium">{conversation.visitorEmail}</span>
                  </div>
                )}

                {/* Chat messages */}
                <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {conversation.messages.length === 0 ? (
                    <p className="py-8 text-center text-sm text-stone-400">
                      No messages in this conversation.
                    </p>
                  ) : (
                    conversation.messages.map((msg, i) => (
                      <ChatBubble key={i} message={msg} />
                    ))
                  )}
                </div>

                {/* Metadata footer */}
                <div className="mt-4 flex items-center gap-4 border-t border-stone-200 pt-3 text-[11px] text-stone-400">
                  <span>
                    Started{" "}
                    {new Date(conversation.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span>·</span>
                  <span>{conversation.messages.length} messages</span>
                  {conversation.estimated_tokens > 0 && (
                    <>
                      <span>·</span>
                      <span>{conversation.estimated_tokens.toLocaleString()} tokens</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="text-center">
        <span className="inline-block rounded-full bg-stone-200 px-3 py-1 text-[11px] text-stone-500">
          {message.content || "System message"}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-200">
          <Bot className="h-3.5 w-3.5 text-stone-600" />
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-stone-900 text-white rounded-br-md"
            : "bg-white border border-stone-200 text-stone-700 rounded-bl-md"
        }`}
      >
        {message.content || "..."}
        {message.timestamp && (
          <div
            className={`mt-1 text-[10px] ${
              isUser ? "text-stone-400" : "text-stone-300"
            }`}
          >
            {formatTime(message.timestamp)}
          </div>
        )}
      </div>
      {isUser && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-800">
          <User className="h-3.5 w-3.5 text-stone-300" />
        </div>
      )}
    </div>
  );
}

function StatusPill({ resolved }: { resolved: boolean }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
        resolved
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-stone-200 bg-stone-100 text-stone-500"
      }`}
    >
      {resolved ? "Resolved" : "Open"}
    </span>
  );
}

function getLatestUserMessage(messages: Message[]) {
  const latest = [...messages]
    .reverse()
    .find((m) => m.role === "user" && m.content?.trim());
  return latest?.content || "No message captured.";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatTime(value: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}
