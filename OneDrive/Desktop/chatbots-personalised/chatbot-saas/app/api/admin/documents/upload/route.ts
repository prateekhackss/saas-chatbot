import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/documents/upload
 * Accepts a file (PDF, TXT, MD, CSV, DOCX) via multipart form-data
 * and returns the extracted plain-text content for the client to use.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 10MB.` },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    let extractedText = '';

    // --- Text-based files: read directly ---
    if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.csv')) {
      extractedText = await file.text();
    }
    // --- PDF files: use pdf-parse ---
    else if (fileName.endsWith('.pdf')) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse');
      const buffer = Buffer.from(await file.arrayBuffer());
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
    }
    // --- Unsupported format ---
    else {
      return NextResponse.json(
        { error: 'Unsupported file type. Supported formats: PDF, TXT, MD, CSV' },
        { status: 400 }
      );
    }

    const trimmed = extractedText.trim();

    if (trimmed.length < 10) {
      return NextResponse.json(
        { error: 'Could not extract enough text from this file. Please try a different file or paste the content manually.' },
        { status: 400 }
      );
    }

    // Derive a suggested title from the filename (without extension)
    const suggestedTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');

    return NextResponse.json({
      content: trimmed,
      suggestedTitle,
      charCount: trimmed.length,
      sourceFileName: file.name,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Failed to process the uploaded file' }, { status: 500 });
  }
}
