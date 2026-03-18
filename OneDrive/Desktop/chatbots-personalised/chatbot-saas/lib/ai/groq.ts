import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';

export type ChatHistoryMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

// Initialize the native Groq provider for Vercel AI SDK
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Streams a chat completion response from Groq using Llama 3.3 70B.
 * 
 * @param systemPrompt The highly-detailed RAG prompt (rules + document context)
 * @param history The previous messages in this conversation session
 * @param userMessage The newest query from the user
 */
export async function streamChatResponse(
  systemPrompt: string,
  history: ChatHistoryMessage[],
  userMessage: string,
  onFinish?: (text: string) => Promise<void>
) {
  // Ensure we don't pass an insanely long history to save context windows
  // We keep the last 5 user/assistant interactions (10 messages total)
  const recentHistory = history.slice(-10);

  // Compile the final messages array for the LLM
  const messages = [
    { role: 'system', content: systemPrompt },
    ...recentHistory,
    { role: 'user', content: userMessage }
  ];

  // We use Llama 3.1 8B Instant for incredibly low-latency and high-speed RAG output
  const streamConfig: any = {
    model: groq('llama-3.1-8b-instant'),
    messages: messages as any,
    temperature: 0.1, // Factual and fast, as requested
    maxTokens: 500, // Prevent runaway generation
    onFinish: async (event: any) => {
      // If the caller provided an onFinish handler, execute it with the final generated text
      if (onFinish && event.text) {
        await onFinish(event.text);
      }
    }
  };

  // Do NOT await the stream here. Return the stream result object 
  // so the API route can attach onFinish handlers and call toDataStreamResponse()
  return streamText(streamConfig);
}
