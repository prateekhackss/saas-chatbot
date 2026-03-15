export interface ChunkOptions {
  chunkSize?: number; // Approximate max characters per chunk (approx representing tokens)
  chunkOverlap?: number;
  separators?: string[];
}

export interface DocumentChunk {
  content: string;
  chunkIndex: number;
}

/**
 * Splits a document into overlapping chunks.
 * We use character count as a proxy for tokens (1 token ≈ 4 characters).
 * So a 500 token chunk is roughly 2000 characters.
 */
export function splitIntoChunks(
  text: string,
  options: ChunkOptions = {}
): DocumentChunk[] {
  // Defaults based on architecture.md (approx 500 tokens = 2000 chars, 50 tokens = 200 chars overlap)
  const {
    chunkSize = 2000,
    chunkOverlap = 200,
    separators = ['\n\n', '\n', '. ', ' '],
  } = options;

  let chunks: string[] = [];
  
  // Start the recursive split process
  chunks = splitText(text, chunkSize, separators);

  // Now reconstruct with overlap
  return mergeChunksWithOverlap(chunks, chunkSize, chunkOverlap);
}

/**
 * Recursively splits text based on a hierarchy of separators
 */
function splitText(text: string, maxSize: number, separators: string[]): string[] {
  if (text.length <= maxSize) return [text];
  
  // Find the first separator that actually exists in the text
  let activeSeparator = '';
  let activeSeparatorExists = false;
  
  for (const separator of separators) {
    if (text.includes(separator)) {
      activeSeparator = separator;
      activeSeparatorExists = true;
      break;
    }
  }

  // If no separators left, we must hard split by character length to prevent infinite loops
  if (!activeSeparatorExists) {
    const hardChunks: string[] = [];
    for (let i = 0; i < text.length; i += maxSize) {
      hardChunks.push(text.slice(i, i + maxSize));
    }
    return hardChunks;
  }

  // Split by the active separator
  const rawSplits = text.split(activeSeparator);
  let result: string[] = [];
  let currentAccumulator = '';

  for (const split of rawSplits) {
    // If a piece is just empty space, ignore
    if (!split.trim()) continue;
    
    // If a single slice is bigger than maxSize, we need to recurse down to the next separator
    if (split.length > maxSize) {
      // First, flush whatever we've collected so far
      if (currentAccumulator) {
        result.push(currentAccumulator);
        currentAccumulator = '';
      }
      
      const remainingSeparators = separators.slice(separators.indexOf(activeSeparator) + 1);
      const smallerSplits = splitText(split, maxSize, remainingSeparators);
      result.push(...smallerSplits);
      continue;
    }

    // Try to accumulate
    const potentialSize = currentAccumulator.length + split.length + activeSeparator.length;
    if (potentialSize <= maxSize) {
      currentAccumulator += (currentAccumulator ? activeSeparator : '') + split;
    } else {
      // Current piece is full, push and start new accumulator
      if (currentAccumulator) result.push(currentAccumulator);
      currentAccumulator = split;
    }
  }

  if (currentAccumulator) {
    result.push(currentAccumulator);
  }

  return result;
}

/**
 * Takes the raw sequential chunks and applies the overlap
 * so context isn't lost at boundaries.
 */
function mergeChunksWithOverlap(rawChunks: string[], maxSize: number, overlapSize: number): DocumentChunk[] {
  const finalChunks: DocumentChunk[] = [];
  
  for (let i = 0; i < rawChunks.length; i++) {
    let content = rawChunks[i];
    
    // If this isn't the first chunk, grab the end of the previous chunk for context
    if (i > 0) {
      const prevChunk = rawChunks[i - 1];
      const overlapContent = prevChunk.slice(-Math.min(overlapSize, prevChunk.length));
      content = overlapContent + ' ' + content;
    }
    
    finalChunks.push({
      content: content.trim(),
      chunkIndex: i
    });
  }
  
  return finalChunks;
}
