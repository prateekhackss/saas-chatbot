"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "How long does it take to set up a chatbot?",
    a: "Most users go from signup to a live chatbot in under 10 minutes. Upload your documents, customize the widget appearance, copy the embed code, and you're live. No coding or AI expertise required.",
  },
  {
    q: "What types of documents can I upload for training?",
    a: "NexusChat supports PDF, DOCX, TXT, and CSV files. You can upload FAQs, product documentation, support policies, pricing pages, and any other text-based content. We automatically chunk, embed, and index everything into a vector knowledge base.",
  },
  {
    q: "Will the chatbot make up answers (hallucinate)?",
    a: "NexusChat uses RAG (Retrieval-Augmented Generation) to ground every response in your actual uploaded documents. If the bot can't find relevant information in your knowledge base, it will use your configured fallback message instead of guessing.",
  },
  {
    q: "Can I customize how the chatbot looks?",
    a: "Yes! You can set brand colors, upload your logo, write a custom welcome message, configure suggested questions, adjust the chat tone, and choose widget positioning. The bot looks and feels like part of your product.",
  },
  {
    q: "How does the embed code work?",
    a: "It's a single script tag you paste before the closing </body> tag on your website. The widget loads asynchronously so it won't slow down your page. It works on any website — React, WordPress, Shopify, plain HTML, etc.",
  },
  {
    q: "Is my data secure?",
    a: "Absolutely. All data is encrypted with 256-bit SSL in transit and at rest. We use domain-locked embeds and embed token validation to prevent unauthorized usage. Your documents and conversations are only accessible from your authenticated dashboard.",
  },
  {
    q: "What happens if I hit my message limit?",
    a: "When you reach your monthly message limit, the chatbot will display a graceful fallback message directing visitors to contact you directly. You'll receive usage warning notifications at 80% and 95% of your limit. You can upgrade anytime to increase your quota.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, all plans come with a 7-day free trial and you can cancel at any time. There are no long-term contracts or hidden fees. If you cancel during the trial, you won't be charged at all.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                isOpen
                  ? "border-red-200 bg-white shadow-lg shadow-red-500/5"
                  : "border-stone-200 bg-stone-50 hover:border-stone-300"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span
                  className={`text-sm font-semibold transition-colors ${
                    isOpen ? "text-red-600" : "text-stone-900"
                  }`}
                >
                  {faq.q}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform duration-300 ${
                    isOpen ? "rotate-180 text-red-500" : "text-stone-400"
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-out ${
                  isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="border-t border-stone-100 px-6 pb-5 pt-4">
                  <p className="text-sm leading-7 text-stone-600">{faq.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
