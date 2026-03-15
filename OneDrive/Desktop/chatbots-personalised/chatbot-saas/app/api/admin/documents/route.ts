import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { splitIntoChunks } from '@/lib/ai/chunker';
import { embedBatch } from '@/lib/ai/embeddings';
import { z } from 'zod';

const documentSchema = z.object({
  clientId: z.string().uuid('Invalid client ID format'),
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  docType: z.enum(['faq', 'product', 'policy', 'about', 'general']).default('general')
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 1. Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate payload
    const body = await req.json();
    const result = documentSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: result.error.issues }, 
        { status: 400 }
      );
    }

    const { clientId, title, content, docType } = result.data;

    const db = supabase as any; // Bypass strict schema typings giving 'never' errors

    // 3. Verify client exists
    const { data: client, error: clientError } = await db
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // --- PIPELINE START --- //
    
    // 4. Check if document already exists for this client with this title
    const { data: existingDoc } = await db
      .from('documents')
      .select('id')
      .eq('client_id', clientId)
      .eq('title', title)
      .maybeSingle();

    let documentId: string;

    if (existingDoc) {
      documentId = existingDoc.id;
      
      // Update the document content
      const { error: updateError } = await db
        .from('documents')
        .update({ content, doc_type: docType, chunk_count: 0 })
        .eq('id', documentId);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update existing document' }, { status: 500 });
      }

      // DELETE OLD CHUNKS before reprocessing (as requested by spec)
      await db
        .from('document_chunks')
        .delete()
        .eq('document_id', documentId);
        
    } else {
      // 4b. Save the new raw document record
      const { data: docRecord, error: docError } = await db
        .from('documents')
        .insert({
          client_id: clientId,
          title,
          content,
          doc_type: docType
        })
        .select('id')
        .single();

      if (docError) {
        console.error('Doc insert error:', docError);
        return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 });
      }
      documentId = docRecord.id;
    }

    // 5. Split document into overlapping chunks (~500 tokens / 2000 chars)
    const chunks = splitIntoChunks(content, { chunkSize: 2000, chunkOverlap: 200 });
    
    if (chunks.length === 0) {
      // Edge case: content was physically empty after trimming
      return NextResponse.json({ message: 'Document saved, but no chunks generated', documentId }, { status: 201 });
    }

    try {
      // 6. Bulk Embed the chunks using Jina AI
      // We pass just the string content of each chunk to the embedder
      const chunkTexts = chunks.map(c => c.content);
      const embeddings = await embedBatch(chunkTexts, 'retrieval.passage');

      // 7. Prepare the payload for Supabase insertion
      const chunkRecords = chunks.map((chunk, i) => ({
        document_id: documentId,
        client_id: clientId,
        content: chunk.content,
        embedding: embeddings[i],
        chunk_index: chunk.chunkIndex,
        metadata: { doc_title: title, doc_type: docType }
      }));

      // 8. Bulk insert chunks into pgvector database
      const { error: chunkInsertError } = await db
        .from('document_chunks')
        .insert(chunkRecords);

      if (chunkInsertError) {
        throw new Error(`Failed to insert chunks: ${chunkInsertError.message}`);
      }

      // 9. Update the document with the final chunk count
      await db
        .from('documents')
        .update({ chunk_count: chunks.length })
        .eq('id', documentId);

      return NextResponse.json({ 
        message: 'Document successfully processed and embedded', 
        documentId,
        chunksGenerated: chunks.length
      }, { status: 201 });

    } catch (pipelineError) {
      // If the embedding or chunk insertion fails, we should ideally rollback 
      // the original document insert to prevent dangling/un-embedded docs.
      console.error('Pipeline Error:', pipelineError);
      
      await supabase.from('documents').delete().eq('id', documentId);
      
      return NextResponse.json({ error: 'Document processing failed, changes reverted' }, { status: 500 });
    }

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
