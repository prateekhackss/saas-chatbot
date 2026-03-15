import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

export type ChatHistoryMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

// Initialize Groq via the OpenAI compatible endpoint in the Vercel AI SDK
// As specified: "Use Vercel AI SDK's createOpenAI with Groq's base URL"
const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
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

  // We use Llama 3.3 70B Versatile for high logic tasks like RAG
  const streamConfig: any = {
    model: groq('llama-3.3-70b-versatile'),
    messages: messages as any,
    temperature: 0.3, // Factual, as requested
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
