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

function ChatInterface({ slug, config }: ChatInterfaceProps) {
  const [sessionId] = useState(() => crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const primaryColor = config.primaryColor || "#000000";
  const botIconUrl = config.logoUrl || null;
  const brandName = config.brandName || "This Company";
  const welcomeMessage =
    config.welcomeMessage || `Hi! I'm the ${brandName} AI assistant. How can I help you?`;

  const handleSuggestedQuestionClick = (question: string) => {
    append({ role: "user", content: question });
  };

  const { messages, input, handleInputChange, handleSubmit, isLoading, append } =
    (useChat({
      api: "/api/chat",
      body: {
        clientSlug: slug,
        sessionId,
      },
      initialMessages: [
        {
          id: "welcome",
          role: "assistant",
          content: welcomeMessage,
        },
      ],
    } as any) as any);

  const hasUserMessages = messages.some((message: any) => message.role === "user");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

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
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto bg-gray-50/50 p-4 scroll-smooth">
        {messages.map((message: any) => (
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
                    ? "border-blue-100 bg-blue-50"
                    : "overflow-hidden border-gray-100 bg-white"
                }`}
              >
                {message.role === "user" ? (
                  <User className="h-4 w-4 text-blue-500" />
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
                    : "rounded-bl-sm border border-gray-100 bg-white text-gray-800"
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
        messages.length > 0 &&
        messages[messages.length - 1].role === "user" ? (
          <div className="flex w-full justify-start animate-fade-in-up">
            <div className="flex max-w-[85%] items-end gap-2">
              <div className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-100 bg-white shadow-sm">
                {botIconUrl ? (
                  <img src={botIconUrl} className="h-full w-full object-cover" />
                ) : (
                  <Bot className="h-4 w-4 text-gray-500" />
                )}
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-gray-100 bg-white px-5 py-3.5 shadow-sm">
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400/60 [animation-delay:-0.3s]"></div>
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400/60 [animation-delay:-0.15s]"></div>
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400/60"></div>
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

      <div className="shrink-0 border-t border-gray-100 bg-white p-3">
        <form onSubmit={handleSubmit} className="group relative flex items-center">
          <input
            value={input}
            onChange={handleInputChange}
            disabled={isLoading}
            placeholder="Type your message..."
            className="w-full rounded-full border border-gray-200 bg-gray-50/50 py-3.5 pl-5 pr-12 text-[14px] text-gray-900 transition-all placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-20 disabled:opacity-50"
            style={
              input
                ? ({
                    "--tw-ring-color": primaryColor,
                    borderColor: primaryColor,
                  } as React.CSSProperties)
                : {}
            }
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
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
    </div>
  );
}
