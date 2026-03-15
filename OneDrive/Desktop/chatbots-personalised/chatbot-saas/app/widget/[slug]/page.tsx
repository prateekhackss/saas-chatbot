'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useState, useRef } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { ClientConfig } from '@/types/database';

export default function WidgetPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [config, setConfig] = useState<ClientConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // We generate a simple session ID to track an individual user's chat session
  const [sessionId] = useState(() => crypto.randomUUID());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch the client's brand configuration on load
    const fetchConfig = async () => {
      try {
        const res = await fetch(`/api/embed/${slug}`);
        if (!res.ok) throw new Error('Failed to load widget config');
        const data = await res.json();
        setConfig(data.config);
      } catch (err) {
        console.error(err);
        setError('This chatbot is currently unavailable.');
      } finally {
        setLoadingConfig(false);
      }
    };

    fetchConfig();
  }, [slug]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    append,
  } = useChat({
    api: '/api/chat',
    body: {
      clientSlug: slug,
      sessionId: sessionId,
      // Pass the previous history so the API can safely parse it
    },
    initialMessages: config ? [
      {
        id: 'welcome',
        role: 'assistant',
        content: config.fallbackMessage || 'Hi there! How can I help you today?',
      }
    ] : [],
  } as any) as any;

  // Re-initialize welcome message if config loads *after* useChat hook initializes
  // In `useChat`, setting `initialMessages` retroactively isn't easily supported.
  // We rely on standard render conditionals to ensure chat UI only mounts *after* config anyway.

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (loadingConfig) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-transparent">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white p-4 text-center text-sm text-gray-500 font-medium font-sans">
        {error || 'Widget configuration missing.'}
      </div>
    );
  }

  // Derive colors from config, with safe fallbacks
  const primaryColor = config?.primaryColor || '#000000';
  const botIconUrl = config?.logoUrl || null;
  const brandName = config?.brandName || 'This Company';

  const handleSuggestedQuestionClick = (question: string) => {
    // Append programmatically executes the completion rather than requiring a synthetic form submission
    append({ role: 'user', content: question });
  };

  return (
    <div className="w-full h-screen flex flex-col bg-white overflow-hidden font-sans border-0 sm:border sm:border-gray-200 sm:rounded-2xl sm:shadow-2xl pointer-events-auto">
      {/* HEADER */}
      <div 
        className="flex items-center p-4 text-white shadow-sm shrink-0"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden mr-3 shrink-0">
          {botIconUrl ? (
             <img src={botIconUrl} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <Bot className="w-5 h-5 text-white" />
          )}
        </div>
        <div className="flex flex-col">
          <h1 className="font-semibold text-[15px] leading-tight shadow-sm">{brandName} Support</h1>
          <span className="text-white/90 text-[11px] flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-sm"></span>
            Typically replies instantly
          </span>
        </div>
      </div>

      {/* CHAT MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-gray-50/50 scroll-smooth">
        
        {/* Render Welcome Message manually if start */}
        {messages.length === 0 && (
          <div className="flex w-full justify-start animate-fade-in-up">
            <div className="flex max-w-[85%] items-end gap-2">
               <div className="w-7 h-7 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center shrink-0 mb-1 overflow-hidden">
                 {botIconUrl ? <img src={botIconUrl} className="w-full h-full object-cover" /> : <Bot className="w-4 h-4 text-gray-500" />}
               </div>
               <div className="px-4 py-3 rounded-2xl rounded-bl-sm text-[13.5px] bg-white border border-gray-100 text-gray-800 shadow-sm leading-relaxed whitespace-pre-wrap">
                 {config.fallbackMessage || `Hi! I'm the ${brandName} AI assistant. How can I help you?`}
               </div>
            </div>
          </div>
        )}

        {messages.map((m: any) => (
          <div key={m.id} className={`flex w-full animate-fade-in-up ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] items-end gap-2 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div 
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mb-1 shadow-sm border
                  ${m.role === 'user' ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-100 overflow-hidden'}
                `}
              >
                {m.role === 'user' ? (
                  <User className="w-4 h-4 text-blue-500" />
                ) : (
                  botIconUrl ? <img src={botIconUrl} className="w-full h-full object-cover" /> : <Bot className="w-4 h-4 text-gray-500" />
                )}
              </div>

              {/* Message Bubble */}
              <div 
                className={`px-4 py-3 rounded-2xl text-[13.5px] shadow-sm leading-relaxed
                  ${m.role === 'user' 
                    ? 'rounded-br-sm text-white font-medium' 
                    : 'rounded-bl-sm bg-white border border-gray-100 text-gray-800'
                  }
                `}
                style={m.role === 'user' ? { backgroundColor: primaryColor } : {}}
              >
                {/* Parse basic newlines */}
                {m.content.split('\n').map((line: string, i: number) => (
                   <span key={i}>
                     {line}
                     {i !== m.content.split('\n').length - 1 && <br />}
                   </span>
                ))}
              </div>

            </div>
          </div>
        ))}
        
        {/* Typing Indicator Animation */}
        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <div className="flex w-full justify-start animate-fade-in-up">
             <div className="flex max-w-[85%] items-end gap-2">
               <div className="w-7 h-7 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center shrink-0 mb-1 overflow-hidden">
                 {botIconUrl ? <img src={botIconUrl} className="w-full h-full object-cover" /> : <Bot className="w-4 h-4 text-gray-500" />}
               </div>
               <div className="px-5 py-3.5 rounded-2xl rounded-bl-sm bg-white border border-gray-100 flex items-center gap-1.5 shadow-sm">
                 <div className="w-1.5 h-1.5 bg-gray-400/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                 <div className="w-1.5 h-1.5 bg-gray-400/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                 <div className="w-1.5 h-1.5 bg-gray-400/60 rounded-full animate-bounce"></div>
               </div>
             </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* SUGGESTED QUESTIONS */}
      {!isLoading && messages.length === 0 && Array.isArray(config?.suggestedQuestions) && config.suggestedQuestions.length > 0 && (
         <div className="px-4 pb-2 pt-1 flex flex-wrap gap-2 justify-start shrink-0 bg-gray-50/50">
           {config.suggestedQuestions.map((q: string, i: number) => (
             <button
               key={i}
               onClick={() => handleSuggestedQuestionClick(q)}
               className="text-[12px] px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-full transition-all border border-gray-200 text-left line-clamp-1 shadow-sm hover:shadow active:scale-95 cursor-pointer font-medium"
               style={{ color: primaryColor }}
             >
               {q}
             </button>
           ))}
         </div>
      )}

      {/* INPUT AREA */}
      <div className="p-3 bg-white border-t border-gray-100 shrink-0">
        <form 
          onSubmit={handleSubmit}
          className="relative flex items-center group"
        >
          <input
            value={input}
            onChange={handleInputChange}
            disabled={isLoading}
            placeholder="Type your message..."
            className="w-full bg-gray-50/50 border border-gray-200 text-[14px] text-gray-900 rounded-full pl-5 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all disabled:opacity-50 placeholder-gray-400"
            style={input ? { '--tw-ring-color': primaryColor, borderColor: primaryColor } as React.CSSProperties : {}}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-1.5 w-10 h-10 flex items-center justify-center rounded-full text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 shadow-sm"
            style={{ backgroundColor: primaryColor }}
          >
            <Send className="w-4 h-4 ml-0.5" /> {/* slight offset for visual centering of inner arrow */}
          </button>
        </form>
        
        {/* Branding Footer */}
        <div className="text-[10px] text-center text-gray-400 mt-2.5 mb-0.5 font-medium tracking-wide w-full flex justify-center items-center gap-1 opacity-80">
           Powered by <span className="font-bold flex items-center text-gray-500">ChatbotsPersonalised</span>
        </div>
      </div>
    </div>
  );
}
