"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  Loader2,
  MessageSquare,
  MessageSquareText,
  PencilLine,
  Save,
  UserPlus,
  X,
} from "lucide-react";

import { useToast } from "@/components/ui/toast-provider";
import type { ClientConfig } from "@/types/database";

type ClientRecord = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  config: ClientConfig;
};

type ClientDetailPanelProps = {
  client: ClientRecord;
  docCount: number;
  convoCount: number;
  hostUrl: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ClientDetailPanel({
  client,
  docCount,
  convoCount,
  hostUrl,
}: ClientDetailPanelProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [clientState, setClientState] = useState(client);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [name, setName] = useState(client.name);
  const [slug, setSlug] = useState(client.slug);
  const [brandName, setBrandName] = useState(client.config.brandName);
  const [welcomeMessage, setWelcomeMessage] = useState(client.config.welcomeMessage);
  const [primaryColor, setPrimaryColor] = useState(client.config.primaryColor);
  const [textColor, setTextColor] = useState(client.config.textColor);
  const [position, setPosition] = useState<ClientConfig["position"]>(
    client.config.position,
  );
  const [tone, setTone] = useState(client.config.tone);
  const [fallbackMessage, setFallbackMessage] = useState(
    client.config.fallbackMessage,
  );
  const [logoUrl, setLogoUrl] = useState(client.config.logoUrl || "");
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(
    client.config.suggestedQuestions || [],
  );

  const safeHostUrl = useMemo(() => hostUrl.replace(/\/$/, ""), [hostUrl]);

  const embedCode = useMemo(() => {
    const activeSlug = slug || clientState.slug;
    return `<script src="${safeHostUrl}/embed.js" data-client="${activeSlug}"></script>`;
  }, [clientState.slug, safeHostUrl, slug]);

  function resetForm() {
    setName(clientState.name);
    setSlug(clientState.slug);
    setBrandName(clientState.config.brandName);
    setWelcomeMessage(clientState.config.welcomeMessage);
    setPrimaryColor(clientState.config.primaryColor);
    setTextColor(clientState.config.textColor);
    setPosition(clientState.config.position);
    setTone(clientState.config.tone);
    setFallbackMessage(clientState.config.fallbackMessage);
    setLogoUrl(clientState.config.logoUrl || "");
    setSuggestedQuestions(clientState.config.suggestedQuestions || []);
  }

  function updateQuestion(index: number, value: string) {
    setSuggestedQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? value : question,
      ),
    );
  }

  function addQuestion() {
    setSuggestedQuestions((current) => [...current, ""]);
  }

  function removeQuestion(index: number) {
    setSuggestedQuestions((current) => current.filter((_, i) => i !== index));
  }
  
  async function autofillFromAnalytics() {
    try {
      const res = await fetch(`/api/admin/analytics?clientId=${clientState.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.suggestedQuestionsFromData && data.suggestedQuestionsFromData.length > 0) {
          setSuggestedQuestions(data.suggestedQuestionsFromData);
          pushToast({
            title: "Questions updated",
            description: "Pulled top questions from recent conversations.",
            variant: "success",
          });
        } else {
           pushToast({
            title: "No data found",
            description: "No recent conversations exist to pull questions from.",
            variant: "error",
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      pushToast({
        title: "Embed code copied",
        description: "The widget snippet is ready to paste into the client website.",
        variant: "success",
      });
      window.setTimeout(() => setCopied(false), 1800);
    } catch (copyError) {
      console.error(copyError);
      setError("Unable to copy the embed code right now.");
      pushToast({
        title: "Copy failed",
        description: "Could not copy the embed code from this browser.",
        variant: "error",
      });
    }
  }

  async function handleSave() {
    setError(null);
    setSuccessMessage(null);

    const trimmedName = name.trim();
    const trimmedBrandName = brandName.trim();
    const trimmedSlug = slugify(slug);
    const trimmedWelcomeMessage = welcomeMessage.trim();
    const trimmedTone = tone.trim();
    const trimmedFallbackMessage = fallbackMessage.trim();
    const trimmedQuestions = suggestedQuestions
      .map((question) => question.trim())
      .filter(Boolean);

    if (!trimmedName) {
      setError("Client name is required.");
      pushToast({
        title: "Missing client name",
        description: "Add a client name before saving the configuration.",
        variant: "error",
      });
      return;
    }

    if (!trimmedBrandName) {
      setError("Brand name is required.");
      pushToast({
        title: "Missing brand name",
        description: "Set the customer-facing brand name before saving.",
        variant: "error",
      });
      return;
    }

    if (!trimmedSlug) {
      setError("Slug is required.");
      pushToast({
        title: "Missing URL slug",
        description: "The widget needs a valid slug for its public URL.",
        variant: "error",
      });
      return;
    }

    if (!trimmedWelcomeMessage || !trimmedTone || !trimmedFallbackMessage) {
      setError("Welcome message, tone, and fallback message are required.");
      pushToast({
        title: "Complete the bot behavior",
        description: "Welcome message, tone, and fallback copy are required.",
        variant: "error",
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/clients/${clientState.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          slug: trimmedSlug,
          config: {
            brandName: trimmedBrandName,
            welcomeMessage: trimmedWelcomeMessage,
            primaryColor,
            textColor,
            position,
            tone: trimmedTone,
            fallbackMessage: trimmedFallbackMessage,
            logoUrl: logoUrl.trim(),
            suggestedQuestions: trimmedQuestions,
          },
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError("That slug already exists. Please choose a different one.");
          pushToast({
            title: "Slug already exists",
            description: "Choose a different public slug for this widget.",
            variant: "error",
          });
        } else {
          setError(payload.error || "Failed to update client.");
          pushToast({
            title: "Update failed",
            description: payload.error || "Please try again in a moment.",
            variant: "error",
          });
        }
        return;
      }

      const nextClient = payload.client as ClientRecord;
      setClientState(nextClient);
      setName(nextClient.name);
      setSlug(nextClient.slug);
      setBrandName(nextClient.config.brandName);
      setWelcomeMessage(nextClient.config.welcomeMessage);
      setPrimaryColor(nextClient.config.primaryColor);
      setTextColor(nextClient.config.textColor);
      setPosition(nextClient.config.position);
      setTone(nextClient.config.tone);
      setFallbackMessage(nextClient.config.fallbackMessage);
      setLogoUrl(nextClient.config.logoUrl || "");
      setSuggestedQuestions(nextClient.config.suggestedQuestions || []);
      setSuccessMessage("Client configuration updated.");
      pushToast({
        title: "Client updated",
        description: "The configuration and preview have been refreshed.",
        variant: "success",
      });
      setIsEditing(false);
      router.refresh();
    } catch (saveError) {
      console.error(saveError);
      setError("Something went wrong while updating the client.");
      pushToast({
        title: "Update failed",
        description: "Something went wrong while updating the client.",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-stone-950">
              {clientState.name}
            </h1>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                clientState.is_active
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-stone-200 text-stone-600"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  clientState.is_active ? "bg-emerald-500" : "bg-stone-400"
                }`}
              />
              {clientState.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-stone-500">
            <span>Slug: {clientState.slug}</span>
            <span className="hidden text-stone-300 sm:inline">/</span>
            <span>Brand: {clientState.config.brandName}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/clients"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:text-stone-950"
          >
            Back to Clients
          </Link>

          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setError(null);
                  setSuccessMessage(null);
                  setIsEditing(false);
                }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:text-stone-950"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-4 text-sm font-semibold text-white shadow-lg shadow-stone-950/15 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setSuccessMessage(null);
                setIsEditing(true);
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-4 text-sm font-semibold text-white shadow-lg shadow-stone-950/15 transition hover:bg-stone-800"
            >
              <PencilLine className="h-4 w-4" />
              Edit Configuration
            </button>
          )}
        </div>
      </div>

      {(error || successMessage) && (
        <div
          className={`rounded-[1.5rem] border p-4 text-sm ${
            error
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          <div className="flex items-start gap-3">
            {error ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <p>{error || successMessage}</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Knowledge Base"
          value={`${docCount} ${docCount === 1 ? "Document" : "Documents"}`}
          description="Upload, refresh, or remove training data."
          href={`/clients/${clientState.id}/documents`}
          linkText="Manage Documents"
          icon={<FileText className="h-5 w-5" />}
        />
        <SummaryCard
          title="Transcripts"
          value="..."
          description="A complete log of conversations."
          href={`/clients/${clientState.id}/conversations`}
          linkText="View Transcripts"
          icon={<MessageSquareText className="h-5 w-5" />}
        />
        <SummaryCard
          title="Leads"
          value="..."
          description="View captured emails."
          href={`/clients/${clientState.id}/leads`}
          linkText="Manage Leads"
          icon={<UserPlus className="h-5 w-5" />}
        />
        <SummaryCard
          title="Performance"
          value={`${convoCount} ${convoCount === 1 ? "Chat" : "Chats"}`}
          description="Review aggregate analytics and usage metrics."
          href={`/clients/${clientState.id}/analytics`}
          linkText="View Analytics"
          icon={<MessageSquare className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.9fr]">
        <section className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-stone-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-stone-950">
                Widget Configuration
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                Update branding, messaging, and the embed snippet for this client.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:text-stone-950"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy Embed Code"}
            </button>
          </div>

          <div className="mt-6 space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Client Name" required>
                {isEditing ? (
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className={inputClassName}
                  />
                ) : (
                  <ReadValue value={clientState.name} />
                )}
              </Field>

              <Field label="Brand Name" required>
                {isEditing ? (
                  <input
                    value={brandName}
                    onChange={(event) => setBrandName(event.target.value)}
                    className={inputClassName}
                  />
                ) : (
                  <ReadValue value={clientState.config.brandName} />
                )}
              </Field>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Slug"
                hint="Used in the widget URL and embed script."
                required
              >
                {isEditing ? (
                  <input
                    value={slug}
                    onChange={(event) => setSlug(slugify(event.target.value))}
                    className={inputClassName}
                  />
                ) : (
                  <ReadValue value={clientState.slug} mono />
                )}
              </Field>

              <Field label="Position" required>
                {isEditing ? (
                  <select
                    value={position}
                    onChange={(event) =>
                      setPosition(event.target.value as ClientConfig["position"])
                    }
                    className={inputClassName}
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                  </select>
                ) : (
                  <ReadValue value={clientState.config.position} />
                )}
              </Field>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Primary Color" required>
                {isEditing ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-stone-200 px-4">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(event) => setPrimaryColor(event.target.value)}
                      className="h-12 w-14 cursor-pointer border-0 bg-transparent p-0"
                    />
                    <span
                      className="h-4 w-4 rounded-full border border-stone-200"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <span className="text-sm font-medium text-stone-600">
                      {primaryColor}
                    </span>
                  </div>
                ) : (
                  <ReadColorValue value={clientState.config.primaryColor} />
                )}
              </Field>

              <Field label="Text Color" required>
                {isEditing ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-stone-200 px-4">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(event) => setTextColor(event.target.value)}
                      className="h-12 w-14 cursor-pointer border-0 bg-transparent p-0"
                    />
                    <span
                      className="h-4 w-4 rounded-full border border-stone-200"
                      style={{ backgroundColor: textColor }}
                    />
                    <span className="text-sm font-medium text-stone-600">
                      {textColor}
                    </span>
                  </div>
                ) : (
                  <ReadColorValue value={clientState.config.textColor} />
                )}
              </Field>
            </div>

            <Field label="Tone" required>
              {isEditing ? (
                <input
                  value={tone}
                  onChange={(event) => setTone(event.target.value)}
                  placeholder='Example: "friendly and concise"'
                  className={inputClassName}
                />
              ) : (
                <ReadValue value={clientState.config.tone} />
              )}
            </Field>

            <Field label="Welcome Message" required>
              {isEditing ? (
                <input
                  value={welcomeMessage}
                  onChange={(event) => setWelcomeMessage(event.target.value)}
                  className={inputClassName}
                />
              ) : (
                <ReadValue value={clientState.config.welcomeMessage} />
              )}
            </Field>

            <Field label="Fallback Message" required>
              {isEditing ? (
                <textarea
                  value={fallbackMessage}
                  onChange={(event) => setFallbackMessage(event.target.value)}
                  rows={4}
                  className={textareaClassName}
                />
              ) : (
                <ReadValue value={clientState.config.fallbackMessage} multiline />
              )}
            </Field>

            <Field label="Logo URL" hint="Optional">
              {isEditing ? (
                <input
                  value={logoUrl}
                  onChange={(event) => setLogoUrl(event.target.value)}
                  placeholder="https://example.com/logo.png"
                  className={inputClassName}
                />
              ) : (
                <ReadValue value={clientState.config.logoUrl || "No logo configured"} mono />
              )}
            </Field>

            <Field
              label="Suggested Questions"
              hint="These appear before the first message in the widget."
            >
              {isEditing ? (
                <div className="space-y-3">
                  {suggestedQuestions.map((question, index) => (
                    <div key={`${index}-${question}`} className="flex items-center gap-3">
                      <input
                        value={question}
                        onChange={(event) => updateQuestion(index, event.target.value)}
                        placeholder={`Suggested question ${index + 1}`}
                        className={inputClassName}
                      />
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-500 transition hover:border-stone-300 hover:text-stone-900"
                        aria-label={`Remove question ${index + 1}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="inline-flex h-11 items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:bg-white hover:text-stone-950"
                    >
                      Add Question
                    </button>
                    <button
                      type="button"
                      onClick={autofillFromAnalytics}
                      className="inline-flex h-11 items-center justify-center rounded-2xl border border-dashed border-teal-200 bg-teal-50 px-4 text-sm font-medium text-teal-700 transition hover:border-teal-300 hover:bg-white hover:text-teal-900"
                    >
                      Auto-fill from analytics
                    </button>
                  </div>
                </div>
              ) : clientState.config.suggestedQuestions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {clientState.config.suggestedQuestions.map((question) => (
                    <span
                      key={question}
                      className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm text-stone-600"
                    >
                      {question}
                    </span>
                  ))}
                </div>
              ) : (
                <ReadValue value="No suggested questions configured yet." />
              )}
            </Field>

            <div className="rounded-[1.5rem] border border-stone-200 bg-stone-950 p-4">
              <div className="mb-3">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">
                  Embed Code
                </div>
                <p className="mt-1 text-sm text-stone-300">
                  Copy and paste this snippet into the client&apos;s site.
                </p>
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-stone-100">
                {embedCode}
              </pre>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight text-stone-950">
                Live Preview
              </h2>
              <p className="text-sm text-stone-500">
                Keep this preview. It renders the hosted widget exactly as customers
                will see it.
              </p>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
              <div
                className="rounded-[1.25rem] px-4 py-4 text-sm shadow-sm"
                style={{ backgroundColor: primaryColor, color: textColor }}
              >
                <div className="text-xs font-semibold uppercase tracking-[0.24em] opacity-75">
                  {brandName || clientState.config.brandName}
                </div>
                <p className="mt-3 text-sm leading-6">
                  {welcomeMessage || clientState.config.welcomeMessage}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-sm">
            <div className="border-b border-stone-200 px-6 py-4">
              <h3 className="text-base font-semibold tracking-tight text-stone-950">
                Hosted Widget
              </h3>
              <p className="mt-1 text-sm text-stone-500">
                Preview URL: {safeHostUrl}/widget/{slug || clientState.slug}
              </p>
            </div>
            <div className="relative h-[620px] bg-stone-100">
              <iframe
                key={slug || clientState.slug}
                src={`${safeHostUrl}/widget/${slug || clientState.slug}`}
                className="relative z-10 h-full w-full border-0"
                title={`${clientState.name} chatbot preview`}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  href,
  linkText,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  href: string;
  linkText: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">
            {title}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-stone-950">
            {value}
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
          {icon}
        </div>
      </div>

      <Link
        href={href}
        className="mt-6 inline-flex text-sm font-semibold text-teal-700 transition hover:text-teal-800"
      >
        {linkText} {"->"}
      </Link>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="flex items-center gap-2 text-sm font-medium text-stone-700">
        {label}
        {required ? <span className="text-rose-500">*</span> : null}
      </span>
      {children}
      {hint ? <span className="block text-xs text-stone-500">{hint}</span> : null}
    </label>
  );
}

function ReadValue({
  value,
  mono,
  multiline,
}: {
  value: string;
  mono?: boolean;
  multiline?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700 ${
        mono ? "font-mono" : ""
      } ${multiline ? "leading-6" : ""}`}
    >
      {value}
    </div>
  );
}

function ReadColorValue({ value }: { value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
      <span
        className="h-4 w-4 rounded-full border border-stone-200"
        style={{ backgroundColor: value }}
      />
      <span className="font-mono">{value}</span>
    </div>
  );
}

const inputClassName =
  "h-12 w-full rounded-2xl border border-stone-200 px-4 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:ring-4 focus:ring-stone-200/60";

const textareaClassName =
  "w-full rounded-[1.5rem] border border-stone-200 px-4 py-3 text-sm leading-6 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-4 focus:ring-stone-200/60";
