// Free tier: 1M tokens/month
// Dimensions: 768

const JINA_API_URL = 'https://api.jina.ai/v1/embeddings';

type TaskType = 'retrieval.passage' | 'retrieval.query';

interface JinaResponse {
  data: Array<{
    embedding: number[];
    index: number;
    object: string;
  }>;
  usage: {
    total_tokens: number;
    prompt_tokens: number;
  };
}

/**
 * Embed a single text string. 
 * Use 'retrieval.query' when embedding a user's question.
 */
export async function embedText(text: string, task: TaskType = 'retrieval.query'): Promise<number[]> {
  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) throw new Error("JINA_API_KEY environment variable is missing.");

  const response = await fetch(JINA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'jina-embeddings-v3',
      task: task,
      dimensions: 768,
      input: [text]
    })
  });

  if (!response.ok) {
    const textResp = await response.text();
    console.error("Jina Embedding Error:", textResp);
    throw new Error(`Jina API error: ${response.status} ${response.statusText}`);
  }

  const data: JinaResponse = await response.json();
  return data.data[0].embedding;
}

/**
 * Embed an array of text strings efficiently in one network request.
 * Use 'retrieval.passage' when embedding document chunks.
 */
export async function embedBatch(texts: string[], task: TaskType = 'retrieval.passage'): Promise<number[][]> {
  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) throw new Error("JINA_API_KEY environment variable is missing.");
  
  if (texts.length === 0) return [];

  const response = await fetch(JINA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'jina-embeddings-v3',
      task: task,
      dimensions: 768,
      input: texts
    })
  });

  if (!response.ok) {
    const textResp = await response.text();
    console.error("Jina Batch Embedding Error:", textResp);
    throw new Error(`Jina API error: ${response.status} ${response.statusText}`);
  }

  const data: JinaResponse = await response.json();
  
  // Re-map the response ensuring the order matches the input array
  // Data is guaranteed to return an array of objects containing the embeddings.
  const embeddings: number[][] = new Array(texts.length);
  for (const item of data.data) {
    embeddings[item.index] = item.embedding;
  }
  
  return embeddings;
}
