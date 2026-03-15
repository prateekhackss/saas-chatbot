"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

const DEFAULT_WELCOME_MESSAGE = "Hi there! How can I help you today?";
const DEFAULT_FALLBACK_MESSAGE =
  "I’m sorry, but I don’t have that information yet. Please contact our team for more help.";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function NewClientPage() {
  const router = useRouter();
  const { pushToast } = useToast();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [brandName, setBrandName] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState(DEFAULT_WELCOME_MESSAGE);
  const [primaryColor, setPrimaryColor] = useState("#0f172a");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [position, setPosition] = useState<"bottom-right" | "bottom-left">(
    "bottom-right",
  );
  const [tone, setTone] = useState("");
  const [fallbackMessage, setFallbackMessage] = useState(
    DEFAULT_FALLBACK_MESSAGE,
  );
  const [logoUrl, setLogoUrl] = useState("");
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    "What services do you offer?",
    "How can I get started?",
  ]);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(slugify(brandName));
    }
  }, [brandName, slugManuallyEdited]);

  const embedCode = useMemo(() => {
    const resolvedSlug = slug || "your-client-slug";
    return `<script src="https://your-domain.com/embed.js" data-client="${resolvedSlug}"></script>`;
  }, [slug]);

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedBrandName = brandName.trim();
    const trimmedSlug = slugify(slug);
    const trimmedTone = tone.trim();
    const trimmedWelcomeMessage = welcomeMessage.trim();
    const trimmedFallbackMessage = fallbackMessage.trim();
    const trimmedQuestions = suggestedQuestions
      .map((question) => question.trim())
      .filter(Boolean);

    if (!trimmedName) {
      setError("Client name is required.");
      pushToast({
        title: "Missing client name",
        description: "Add a client name before creating the workspace.",
        variant: "error",
      });
      return;
    }

    if (!trimmedBrandName) {
      setError("Brand name is required.");
      pushToast({
        title: "Missing brand name",
        description: "Set the customer-facing brand name first.",
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
        description: "Welcome message, tone, and fallback copy are all required.",
        variant: "error",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/clients", {
        method: "POST",
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
            description: "Choose a different public slug for this client widget.",
            variant: "error",
          });
        } else {
          setError(payload.error || "Failed to create client.");
          pushToast({
            title: "Client creation failed",
            description: payload.error || "Please try again in a moment.",
            variant: "error",
          });
        }
        return;
      }

      pushToast({
        title: "Client created",
        description: "Redirecting you to the new client workspace.",
        variant: "success",
      });
      router.push(`/clients/${payload.id}`);
      router.refresh();
    } catch (submitError) {
      console.error(submitError);
      setError("Something went wrong while creating the client.");
      pushToast({
        title: "Client creation failed",
        description: "Something went wrong while creating the client.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopyEmbedCode() {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      pushToast({
        title: "Embed code copied",
        description: "The script snippet is ready to paste into a client site.",
        variant: "success",
      });
      window.setTimeout(() => setCopied(false), 1800);
    } catch (copyError) {
      console.error(copyError);
      pushToast({
        title: "Copy failed",
        description: "Could not copy the embed code from this browser.",
        variant: "error",
      });
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
            Client Onboarding
          </p>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Onboard New Client
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Configure branding, bot behavior, and suggested questions before
              you deploy the widget.
            </p>
          </div>
        </div>
        <Link
          href="/clients"
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
        >
          Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.45fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeader
              title="Basic Info"
              description="Set the internal client record and the public widget slug."
            />
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="Client Name" required>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Sarah's Fitness Coaching"
                  className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                />
              </Field>

              <Field label="Brand Name" required>
                <input
                  value={brandName}
                  onChange={(event) => setBrandName(event.target.value)}
                  placeholder="What customers should see"
                  className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                />
              </Field>
            </div>

            <div className="mt-5">
              <Field
                label="URL Slug"
                hint="Auto-generated from the brand name until you edit it manually."
                required
              >
                <input
                  value={slug}
                  onChange={(event) => {
                    setSlugManuallyEdited(true);
                    setSlug(slugify(event.target.value));
                  }}
                  placeholder="sarahs-fitness-coaching"
                  className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeader
              title="Branding"
              description="Tune the widget look and first-impression copy."
            />
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="Primary Color" required>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(event) => setPrimaryColor(event.target.value)}
                    className="h-12 w-14 cursor-pointer border-0 bg-transparent p-0"
                  />
                  <span
                    className="h-4 w-4 rounded-full border border-slate-200"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <span className="text-sm font-medium text-slate-600">
                    {primaryColor}
                  </span>
                </div>
              </Field>

              <Field label="Text Color" required>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(event) => setTextColor(event.target.value)}
                    className="h-12 w-14 cursor-pointer border-0 bg-transparent p-0"
                  />
                  <span
                    className="h-4 w-4 rounded-full border border-slate-200"
                    style={{ backgroundColor: textColor }}
                  />
                  <span className="text-sm font-medium text-slate-600">
                    {textColor}
                  </span>
                </div>
              </Field>
            </div>

            <div className="mt-5 space-y-5">
              <Field label="Welcome Message" required>
                <input
                  value={welcomeMessage}
                  onChange={(event) => setWelcomeMessage(event.target.value)}
                  placeholder="Hi there! How can I help you today?"
                  className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                />
              </Field>

              <Field label="Logo URL" hint="Optional">
                <input
                  value={logoUrl}
                  onChange={(event) => setLogoUrl(event.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeader
              title="Behavior"
              description="Define how the assistant greets users and what it does when context is missing."
            />
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="Widget Position" required>
                <select
                  value={position}
                  onChange={(event) =>
                    setPosition(event.target.value as "bottom-right" | "bottom-left")
                  }
                  className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                </select>
              </Field>

              <Field label="Tone" required>
                <input
                  value={tone}
                  onChange={(event) => setTone(event.target.value)}
                  placeholder='Examples: "friendly and casual", "professional and concise"'
                  className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                />
              </Field>
            </div>

            <div className="mt-5">
              <Field
                label="Fallback Message"
                hint="Shown only when the bot does not know the answer."
                required
              >
                <textarea
                  value={fallbackMessage}
                  onChange={(event) => setFallbackMessage(event.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeader
              title="Suggested Questions"
              description="Preload common prompts to help users start a conversation quickly."
            />
            <div className="mt-6 space-y-3">
              {suggestedQuestions.map((question, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    value={question}
                    onChange={(event) => updateQuestion(index, event.target.value)}
                    placeholder={`Suggested question ${index + 1}`}
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                  />
                  <button
                    type="button"
                    onClick={() => removeQuestion(index)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                    aria-label={`Remove question ${index + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addQuestion}
              className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-950"
            >
              <Plus className="h-4 w-4" />
              Add Question
            </button>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeader
              title="Live Snapshot"
              description="Preview the key widget choices before creating the client."
            />
            <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <div
                className="rounded-[1.25rem] px-4 py-4 text-sm shadow-sm"
                style={{ backgroundColor: primaryColor, color: textColor }}
              >
                <div className="text-xs font-semibold uppercase tracking-[0.24em] opacity-75">
                  {brandName || "Brand Name"}
                </div>
                <p className="mt-3 text-sm leading-6">
                  {welcomeMessage || DEFAULT_WELCOME_MESSAGE}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <PreviewStat label="Position" value={position} />
                <PreviewStat
                  label="Questions"
                  value={String(
                    suggestedQuestions.map((question) => question.trim()).filter(Boolean)
                      .length,
                  )}
                />
              </div>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <SectionHeader
                title="Embed Code Preview"
                description="This is the script snippet clients will paste into their site."
              />
              <button
                type="button"
                onClick={handleCopyEmbedCode}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="mt-6 overflow-x-auto rounded-[1.25rem] bg-slate-950 p-4 text-xs leading-6 text-slate-100">
              {embedCode}
            </pre>
          </section>

          {error && (
            <div
              className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            </div>
          )}

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tight text-slate-950">
                  Ready to deploy
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Once created, you&apos;ll be redirected to the client workspace
                  where you can manage documents, analytics, and the live widget
                  preview.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating client...
                  </>
                ) : (
                  "Create Client"
                )}
              </button>

              <Link
                href="/clients"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
              >
                Cancel
              </Link>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-slate-950">
        {title}
      </h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
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
      <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-rose-500">*</span> : null}
      </span>
      {children}
      {hint ? <span className="block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

function PreviewStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}
