"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { Bot, Loader2, Send, User } from "lucide-react";
import { ClientConfig } from "@/types/database";

export function WidgetPageClient() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [config, setConfig] = useState<ClientConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`/api/embed/${slug}`);

        if (!response.ok) {
          throw new Error("Failed to load widget config");
        }

        const data = await response.json();
        setConfig(data.config);
      } catch (fetchError) {
        console.error(fetchError);
        setError("This chatbot is currently unavailable.");
      } finally {
        setLoadingConfig(false);
      }
    };

    fetchConfig();
  }, [slug]);

  if (loadingConfig) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-transparent">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white p-4 text-center font-sans text-sm font-medium text-gray-500">
        {error || "Widget configuration missing."}
      </div>
    );
  }

  return <ChatInterface slug={slug} config={config} />;
}

type ChatInterfaceProps = {
  slug: string;
  config: ClientConfig;
};

function isWithinBusinessHours(config: ClientConfig): boolean {
  if (!config.businessHours?.enabled) return true; // no config = always online
  
  const now = new Date();
  const tz = config.businessHours.timezone || 'UTC';
  const formatter = new Intl.DateTimeFormat('en-US', { 
    timeZone: tz, 
    weekday: 'short', 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });
  
  const parts = formatter.formatToParts(now);
  const day = parts.find(p => p.type === 'weekday')?.value?.toLowerCase().slice(0, 3);
  const hour = parts.find(p => p.type === 'hour')?.value;
  const minute = parts.find(p => p.type === 'minute')?.value;
  const currentTime = `${hour}:${minute}`;
  
  const daySchedule = config.businessHours.schedule[day || ''];
  if (!daySchedule) return false; // no schedule for this day = offline
  
  return currentTime >= daySchedule.start && currentTime <= daySchedule.end;
}

function ChatInterface({ slug, config }: ChatInterfaceProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const isOnline = isWithinBusinessHours(config);
  const [leadFormState, setLeadFormState] = useState({ name: '', email: '', submitting: false, error: '' });

  useEffect(() => {
    // 1. Initialize or load Session ID
    const storageKey = `nexuschat-session-${slug}`;
    let currentSessionId = window.localStorage.getItem(storageKey);
    if (!currentSessionId) {
      currentSessionId = crypto.randomUUID();
      window.localStorage.setItem(storageKey, currentSessionId);
    }
    setSessionId(currentSessionId);

    // 2. Load Lead Capture state
    if (window.localStorage.getItem(`nexuschat-lead-${slug}`) === 'captured') {
      setLeadCaptured(true);
    }
  }, [slug]);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadFormState(prev => ({ ...prev, submitting: true, error: '' }));
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientSlug: slug,
          sessionId,
          name: leadFormState.name,
          email: leadFormState.email
        })
      });
      if (!res.ok) throw new Error('Failed to submit');
      
      localStorage.setItem(`nexuschat-lead-${slug}`, 'captured');
      setLeadCaptured(true);
    } catch (err) {
      setLeadFormState(prev => ({ ...prev, error: 'Please try again.', submitting: false }));
    }
  };

  const primaryColor = config.primaryColor || "#0F766E";
  const botIconUrl = config.logoUrl || null;
  const brandName = config.brandName || "This Company";
  const welcomeMessage =
    config.welcomeMessage || `Hi! I'm the ${brandName} AI assistant. How can I help you?`;



  const { messages, input, handleInputChange, handleSubmit, isLoading, append } =
    useChat({
      api: "/api/chat",
      body: {
        clientSlug: slug,
        sessionId,
      },
    });

  const handleSuggestedQuestionClick = (question: string) => {
    append({ role: "user", content: question });
  };

  const welcomeMsg = {
    id: "welcome",
    role: "assistant" as const,
    content: welcomeMessage,
  };
  const allMessages = [welcomeMsg, ...messages];

  const hasUserMessages = allMessages.some((message: any) => message.role === "user");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (!sessionId) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-teal-600/50" />
      </div>
    );
  }

  return (
    <div className="pointer-events-auto flex h-screen w-full flex-col overflow-hidden border-0 bg-white font-sans sm:rounded-2xl sm:border sm:border-gray-200 sm:shadow-2xl">
      <div
        className="flex shrink-0 items-center p-4 text-white shadow-sm"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20">
          {botIconUrl ? (
            <img src={botIconUrl} alt="Logo" className="h-full w-full object-cover" />
          ) : (
            <Bot className="h-5 w-5 text-white" />
          )}
        </div>
        <div className="flex flex-col">
          <h1 className="text-[15px] font-semibold leading-tight shadow-sm">
            {brandName} Support
          </h1>
          <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/90">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400 shadow-sm"></span>
            Typically replies instantly
          </span>
        </div>
        <button 
          onClick={() => {
            const storageKey = `nexuschat-session-${slug}`;
            localStorage.removeItem(storageKey);
            window.location.reload();
          }}
          className="ml-auto text-[11px] text-white/70 hover:text-white transition"
          title="Start new conversation"
        >
          New chat
        </button>
      </div>

      {!isOnline && leadCaptured ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gray-50/50">
           <Bot className="h-12 w-12 text-gray-300 mb-4" />
           <p className="text-gray-600 font-medium">Thank you! We will get back to you soon.</p>
        </div>
      ) : (!isOnline || (config.leadCaptureEnabled && !leadCaptured)) ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gray-50/50">
          <Bot className="h-10 w-10 text-gray-400 mb-3" />
          <p className="text-sm font-medium text-gray-700 mb-6">
            {!isOnline 
              ? (config.offlineMessage || "We're currently offline. Leave your email and we'll get back to you!")
              : (config.leadCaptureMessage || "Before we chat, could you share your email?")}
          </p>
          
          <form onSubmit={handleLeadSubmit} className="w-full max-w-sm space-y-3">
            <input
              type="text"
              placeholder="Name (Optional)"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-opacity-20"
              style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
              value={leadFormState.name}
              onChange={e => setLeadFormState(prev => ({ ...prev, name: e.target.value }))}
              disabled={leadFormState.submitting}
            />
            <input
              type="email"
              placeholder="Email Address"
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-opacity-20"
              style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
              value={leadFormState.email}
              onChange={e => setLeadFormState(prev => ({ ...prev, email: e.target.value }))}
              disabled={leadFormState.submitting}
            />
            {leadFormState.error && (
               <p className="text-xs text-red-500">{leadFormState.error}</p>
            )}
            <button
              type="submit"
              disabled={leadFormState.submitting}
              className="w-full flex justify-center rounded-xl py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90 transition disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {leadFormState.submitting ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : "Start Chatting"}
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-5 overflow-y-auto bg-gray-50/50 p-4 scroll-smooth">
            {allMessages.map((message: any) => (
              <div
                key={message.id}
                className={`flex w-full animate-fade-in-up ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex max-w-[85%] items-end gap-2 ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border shadow-sm ${
                      message.role === "user"
                        ? "border-teal-100 bg-teal-50"
                        : "overflow-hidden border-teal-50 bg-white"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="h-4 w-4 text-teal-600" />
                    ) : botIconUrl ? (
                      <img src={botIconUrl} className="h-full w-full object-cover" />
                    ) : (
                      <Bot className="h-4 w-4 text-gray-500" />
                    )}
                  </div>

                  <div
                    className={`rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed shadow-sm ${
                      message.role === "user"
                        ? "rounded-br-sm font-medium text-white"
                        : "rounded-bl-sm border border-teal-50 bg-white text-gray-800"
                    }`}
                    style={message.role === "user" ? { backgroundColor: primaryColor } : {}}
                  >
                    {message.content.split("\n").map((line: string, index: number) => (
                      <span key={index}>
                        {line}
                        {index !== message.content.split("\n").length - 1 ? <br /> : null}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {isLoading &&
            allMessages.length > 0 &&
            allMessages[allMessages.length - 1].role === "user" ? (
              <div className="flex w-full justify-start animate-fade-in-up">
                <div className="flex max-w-[85%] items-end gap-2">
                  <div className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-teal-50 bg-white shadow-sm">
                    {botIconUrl ? (
                      <img src={botIconUrl} className="h-full w-full object-cover" />
                    ) : (
                      <Bot className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-teal-50 bg-white px-5 py-3.5 shadow-sm">
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400/60 [animation-delay:-0.3s]"></div>
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400/60 [animation-delay:-0.15s]"></div>
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400/60"></div>
                  </div>
                </div>
              </div>
            ) : null}

            <div ref={messagesEndRef} className="h-2" />
          </div>

          {!isLoading &&
          !hasUserMessages &&
          Array.isArray(config.suggestedQuestions) &&
          config.suggestedQuestions.length > 0 ? (
            <div className="flex shrink-0 flex-wrap justify-start gap-2 bg-gray-50/50 px-4 pb-2 pt-1">
              {config.suggestedQuestions.map((question: string, index: number) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestionClick(question)}
                  className="line-clamp-1 cursor-pointer rounded-full border border-gray-200 bg-white px-3.5 py-2 text-left text-[12px] font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow active:scale-95"
                  style={{ color: primaryColor }}
                >
                  {question}
                </button>
              ))}
            </div>
          ) : null}

          <div className="shrink-0 border-t border-teal-50 bg-white p-3">
            <form onSubmit={handleSubmit} className="group relative flex items-center">
              <input
                value={input}
                onChange={handleInputChange}
                disabled={isLoading}
                placeholder="Type your message..."
                className="w-full rounded-full border border-gray-200 bg-gray-50/50 py-3.5 pl-5 pr-12 text-[14px] text-gray-900 transition-all placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-20 disabled:opacity-50"
                style={
                  (input || "").trim()
                    ? ({
                        "--tw-ring-color": primaryColor,
                        borderColor: primaryColor,
                      } as React.CSSProperties)
                    : {}
                }
              />
              <button
                type="submit"
                disabled={isLoading || !(input || "").trim()}
                className="absolute right-1.5 flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                <Send className="ml-0.5 h-4 w-4" />
              </button>
            </form>

            <div className="mt-2.5 mb-0.5 flex w-full items-center justify-center gap-1 text-center text-[10px] font-medium tracking-wide text-gray-400 opacity-80">
              Powered by
              <span className="flex items-center font-bold text-gray-500">
                NexusChat
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
