"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Trash2,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast-provider";
import { createClient } from "@/lib/supabase/client";

type DocumentType = "faq" | "product" | "policy" | "about" | "general";

type DocumentRecord = {
  id: string;
  title: string;
  doc_type: DocumentType;
  char_count: number;
  chunk_count: number;
  created_at: string;
};

type ClientRecord = {
  id: string;
  name: string;
};

const progressMessages = [
  "Chunking document...",
  "Generating embeddings...",
  "Storing vectors...",
];

export default function ClientDocumentsPage() {
  const params = useParams<{ id: string }>();
  const clientId = params.id;
  const { pushToast } = useToast();

  const [client, setClient] = useState<ClientRecord | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState<DocumentType>("general");
  const [content, setContent] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState(progressMessages[0]);
  const [highlightedDocumentId, setHighlightedDocumentId] = useState<string | null>(
    null,
  );
  const [documentPendingDelete, setDocumentPendingDelete] =
    useState<DocumentRecord | null>(null);

  async function loadKnowledgeBase() {
    setLoadError(null);

    try {
      const supabase = createClient() as any;

      const [{ data: clientData, error: clientError }, { data: docsData, error: docsError }] =
        await Promise.all([
          supabase.from("clients").select("id, name").eq("id", clientId).single(),
          supabase
            .from("documents")
            .select("id, title, doc_type, char_count, chunk_count, created_at")
            .eq("client_id", clientId)
            .order("created_at", { ascending: false }),
        ]);

      if (clientError || docsError) {
        throw new Error("Failed to load knowledge base");
      }

      setClient(clientData as ClientRecord);
      setDocuments((docsData || []) as DocumentRecord[]);
    } catch (error) {
      console.error(error);
      setLoadError("Unable to load this knowledge base right now.");
    } finally {
      setIsLoadingData(false);
    }
  }

  useEffect(() => {
    if (!clientId) {
      return;
    }

    loadKnowledgeBase();
  }, [clientId]);

  useEffect(() => {
    if (!isSubmitting) {
      setProgressMessage(progressMessages[0]);
      return;
    }

    let currentIndex = 0;
    const interval = window.setInterval(() => {
      currentIndex = Math.min(currentIndex + 1, progressMessages.length - 1);
      setProgressMessage(progressMessages[currentIndex]);
    }, 1200);

    return () => {
      window.clearInterval(interval);
    };
  }, [isSubmitting]);

  useEffect(() => {
    if (!highlightedDocumentId) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setHighlightedDocumentId(null);
    }, 2600);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [highlightedDocumentId]);

  const totalChunks = documents.reduce(
    (sum, document) => sum + (document.chunk_count || 0),
    0,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle) {
      setFormError("Document title is required.");
      pushToast({
        title: "Missing document title",
        description: "Add a title before processing the document.",
        variant: "error",
      });
      return;
    }

    if (trimmedContent.length < 10) {
      setFormError("Document content must be at least 10 characters.");
      pushToast({
        title: "Document content is too short",
        description: "Add more content so the AI has enough material to train on.",
        variant: "error",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId,
          title: trimmedTitle,
          content: trimmedContent,
          docType,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setFormError(payload.error || "Failed to process document.");
        pushToast({
          title: "Document processing failed",
          description: payload.error || "Please try again in a moment.",
          variant: "error",
        });
        return;
      }

      setSuccessMessage(
        `Document processed: ${payload.chunksGenerated || 0} chunks generated.`,
      );
      pushToast({
        title: "Knowledge base updated",
        description: `Document processed with ${payload.chunksGenerated || 0} generated chunks.`,
        variant: "success",
      });
      setTitle("");
      setDocType("general");
      setContent("");
      await loadKnowledgeBase();

      if (payload.documentId) {
        setHighlightedDocumentId(payload.documentId);
      }
    } catch (error) {
      console.error(error);
      setFormError("Something went wrong while processing the document.");
      pushToast({
        title: "Document processing failed",
        description: "Something went wrong while processing the document.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmDeleteDocument() {
    if (!documentPendingDelete) {
      return;
    }

    setFormError(null);
    setSuccessMessage(null);
    setDeletingDocumentId(documentPendingDelete.id);

    try {
      const response = await fetch(`/api/admin/documents/${documentPendingDelete.id}`, {
        method: "DELETE",
      });

      const payload = await response.json();

      if (!response.ok) {
        setFormError(payload.error || "Failed to delete document.");
        pushToast({
          title: "Delete failed",
          description: payload.error || "The document could not be removed.",
          variant: "error",
        });
        return;
      }

      setSuccessMessage("Document deleted successfully.");
      pushToast({
        title: "Document deleted",
        description: `"${documentPendingDelete.title}" was removed from the knowledge base.`,
        variant: "success",
      });
      await loadKnowledgeBase();
      setDocumentPendingDelete(null);
    } catch (error) {
      console.error(error);
      setFormError("Something went wrong while deleting the document.");
      pushToast({
        title: "Delete failed",
        description: "Something went wrong while deleting the document.",
        variant: "error",
      });
    } finally {
      setDeletingDocumentId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
            Knowledge Base
          </p>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              {client?.name ? `${client.name} Documents` : "Knowledge Base"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {`Knowledge Base: ${totalChunks} chunks from ${documents.length} ${
                documents.length === 1 ? "document" : "documents"
              }`}
            </p>
          </div>
        </div>
        <Link
          href={`/clients/${clientId}`}
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
        >
          Back to Client
        </Link>
      </div>

      {(formError || successMessage || loadError) && (
        <div
          className={`rounded-[1.5rem] border p-4 text-sm ${
            formError || loadError
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          <div className="flex items-start gap-3">
            {formError || loadError ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <p>{formError || loadError || successMessage}</p>
          </div>
        </div>
      )}

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Upload New Document
          </h2>
          <p className="text-sm text-slate-500">
            Paste your FAQ, product descriptions, company policies, or any text
            content. The AI will learn from this to answer customer questions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid gap-5 md:grid-cols-[1.5fr_0.75fr]">
            <Field label="Title" required>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Document Title (e.g. Return Policy)"
                className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
              />
            </Field>

            <Field label="Document Type" required>
              <select
                value={docType}
                onChange={(event) => setDocType(event.target.value as DocumentType)}
                className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
              >
                <option value="faq">FAQ</option>
                <option value="product">Product</option>
                <option value="policy">Policy</option>
                <option value="about">About</option>
                <option value="general">General</option>
              </select>
            </Field>
          </div>

          <Field label="Content" required>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={14}
              placeholder="Paste raw text content here..."
              className="w-full rounded-[1.5rem] border border-slate-200 px-4 py-4 font-mono text-sm leading-6 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
            />
            <div className="mt-2 text-right text-xs text-slate-500">
              {content.length.toLocaleString()} characters
            </div>
          </Field>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium text-slate-900">
                  Ready to process and train the AI
                </div>
                <div className="text-sm text-slate-500">
                  {isSubmitting
                    ? progressMessage
                    : "We’ll chunk the document, generate embeddings, and store vectors automatically."}
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Process & Train AI"
                )}
              </button>
            </div>

            {isSubmitting ? (
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-sky-600" />
              </div>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Trained Documents
          </h2>
        </div>

        {isLoadingData ? (
          <div className="flex items-center justify-center px-6 py-16 text-sm text-slate-500">
            <Loader2 className="mr-3 h-4 w-4 animate-spin" />
            Loading documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <FileText className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-lg font-semibold tracking-tight text-slate-950">
              No documents yet
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Upload your first document above to start training the AI.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <div className="grid grid-cols-[minmax(0,2fr)_110px_110px_110px_140px_110px] gap-4 border-b border-slate-200 bg-slate-50/80 px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <span>Title</span>
                <span>Type</span>
                <span>Characters</span>
                <span>Chunks</span>
                <span>Created</span>
                <span className="text-right">Action</span>
              </div>
              <div className="divide-y divide-slate-100">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className={`grid grid-cols-[minmax(0,2fr)_110px_110px_110px_140px_110px] items-center gap-4 px-6 py-5 transition ${
                      highlightedDocumentId === document.id
                        ? "bg-emerald-50"
                        : "hover:bg-slate-50/80"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-950">
                        {document.title}
                      </div>
                    </div>
                    <div className="text-sm capitalize text-slate-600">
                      {document.doc_type}
                    </div>
                    <div className="text-sm text-slate-600">
                      {document.char_count.toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-600">
                      {document.chunk_count.toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-500">
                      {formatDate(document.created_at)}
                    </div>
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setDocumentPendingDelete(document)}
                        disabled={deletingDocumentId === document.id}
                        className="inline-flex items-center gap-2 text-sm font-medium text-rose-600 transition hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingDocumentId === document.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 p-4 md:hidden">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className={`rounded-[1.5rem] border p-5 transition ${
                    highlightedDocumentId === document.id
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold tracking-tight text-slate-950">
                        {document.title}
                      </h3>
                      <p className="mt-1 text-sm capitalize text-slate-500">
                        {document.doc_type}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDocumentPendingDelete(document)}
                      disabled={deletingDocumentId === document.id}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-200 bg-white text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingDocumentId === document.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <SummaryTile
                      label="Characters"
                      value={document.char_count.toLocaleString()}
                    />
                    <SummaryTile
                      label="Chunks"
                      value={document.chunk_count.toLocaleString()}
                    />
                    <SummaryTile label="Created" value={formatDate(document.created_at)} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(documentPendingDelete)}
        title="Delete this document?"
        description={
          documentPendingDelete
            ? `Are you sure? This will remove all trained data from "${documentPendingDelete.title}".`
            : ""
        }
        confirmLabel="Delete Document"
        busy={Boolean(deletingDocumentId)}
        onCancel={() => {
          if (!deletingDocumentId) {
            setDocumentPendingDelete(null);
          }
        }}
        onConfirm={confirmDeleteDocument}
      />
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-rose-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function SummaryTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
      <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
