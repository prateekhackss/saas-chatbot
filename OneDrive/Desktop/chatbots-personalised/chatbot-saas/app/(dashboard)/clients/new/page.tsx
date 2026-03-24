"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  Loader2,
  Palette,
  Plus,
  Rocket,
  Settings2,
  Sparkles,
  Type,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

const DEFAULT_WELCOME_MESSAGE = "Hi there! How can I help you today?";
const DEFAULT_FALLBACK_MESSAGE =
  "I'm sorry, but I don't have that information yet. Please contact our team for more help.";

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
      pushToast({ title: "Missing client name", description: "Add a client name before creating the workspace.", variant: "error" });
      return;
    }

    if (!trimmedBrandName) {
      setError("Brand name is required.");
      pushToast({ title: "Missing brand name", description: "Set the customer-facing brand name first.", variant: "error" });
      return;
    }

    if (!trimmedSlug) {
      setError("Slug is required.");
      pushToast({ title: "Missing URL slug", description: "The widget needs a valid slug for its public URL.", variant: "error" });
      return;
    }

    if (!trimmedWelcomeMessage || !trimmedTone || !trimmedFallbackMessage) {
      setError("Welcome message, tone, and fallback message are required.");
      pushToast({ title: "Complete the bot behavior", description: "Welcome message, tone, and fallback copy are all required.", variant: "error" });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
          pushToast({ title: "Slug already exists", description: "Choose a different public slug for this client widget.", variant: "error" });
        } else {
          setError(payload.error || "Failed to create client.");
          pushToast({ title: "Client creation failed", description: payload.error || "Please try again in a moment.", variant: "error" });
        }
        return;
      }

      pushToast({ title: "Client created", description: "Redirecting you to the new client workspace.", variant: "success" });
      router.push(`/clients/${payload.id}`);
      router.refresh();
    } catch (submitError) {
      console.error(submitError);
      setError("Something went wrong while creating the client.");
      pushToast({ title: "Client creation failed", description: "Something went wrong while creating the client.", variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopyEmbedCode() {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      pushToast({ title: "Embed code copied", description: "The script snippet is ready to paste into a client site.", variant: "success" });
      window.setTimeout(() => setCopied(false), 1800);
    } catch (copyError) {
      console.error(copyError);
      pushToast({ title: "Copy failed", description: "Could not copy the embed code from this browser.", variant: "error" });
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/20">
              <Rocket className="h-4 w-4 text-white" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
              Client Onboarding
            </p>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-950">
            New Chatbot
          </h1>
          <p className="text-sm text-stone-500">
            Configure branding, behavior, and suggested questions before deploying.
          </p>
        </div>
        <Link
          href="/clients"
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:text-stone-950"
        >
          Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.45fr_0.9fr]">
        {/* Left Column — Form Sections */}
        <div className="space-y-5">
          {/* Basic Info */}
          <FormSection
            icon={<Type className="h-4 w-4" />}
            title="Basic Info"
            description="Internal record and public widget slug"
            gradient="from-violet-500 to-purple-600"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Client Name" required>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah's Fitness Coaching"
                  className={inputClass}
                />
              </Field>
              <Field label="Brand Name" required>
                <input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="What customers should see"
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="mt-4">
              <Field
                label="URL Slug"
                hint="Auto-generated from the brand name until you edit it manually."
                required
              >
                <input
                  value={slug}
                  onChange={(e) => {
                    setSlugManuallyEdited(true);
                    setSlug(slugify(e.target.value));
                  }}
                  placeholder="sarahs-fitness-coaching"
                  className={inputClass}
                />
              </Field>
            </div>
          </FormSection>

          {/* Branding */}
          <FormSection
            icon={<Palette className="h-4 w-4" />}
            title="Branding"
            description="Widget look and first-impression copy"
            gradient="from-pink-500 to-rose-600"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Primary Color" required>
                <div className="flex items-center gap-3 rounded-2xl border border-stone-200 px-4">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-12 w-14 cursor-pointer border-0 bg-transparent p-0"
                  />
                  <span
                    className="h-4 w-4 rounded-full border border-stone-200"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <span className="text-sm font-medium text-stone-600">{primaryColor}</span>
                </div>
              </Field>
              <Field label="Text Color" required>
                <div className="flex items-center gap-3 rounded-2xl border border-stone-200 px-4">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="h-12 w-14 cursor-pointer border-0 bg-transparent p-0"
                  />
                  <span
                    className="h-4 w-4 rounded-full border border-stone-200"
                    style={{ backgroundColor: textColor }}
                  />
                  <span className="text-sm font-medium text-stone-600">{textColor}</span>
                </div>
              </Field>
            </div>
            <div className="mt-4 space-y-4">
              <Field label="Welcome Message" required>
                <input
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Hi there! How can I help you today?"
                  className={inputClass}
                />
              </Field>
              <Field label="Logo URL" hint="Optional">
                <input
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className={inputClass}
                />
              </Field>
            </div>
          </FormSection>

          {/* Behavior */}
          <FormSection
            icon={<Settings2 className="h-4 w-4" />}
            title="Behavior"
            description="How the assistant greets users and handles missing context"
            gradient="from-blue-500 to-cyan-600"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Widget Position" required>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value as "bottom-right" | "bottom-left")}
                  className={inputClass}
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                </select>
              </Field>
              <Field label="Tone" required>
                <input
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  placeholder='"friendly and casual", "professional"'
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Fallback Message" hint="Shown when bot doesn't know the answer." required>
                <textarea
                  value={fallbackMessage}
                  onChange={(e) => setFallbackMessage(e.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:ring-4 focus:ring-stone-200/60"
                />
              </Field>
            </div>
          </FormSection>

          {/* Suggested Questions */}
          <FormSection
            icon={<Sparkles className="h-4 w-4" />}
            title="Suggested Questions"
            description="Help users start a conversation quickly"
            gradient="from-amber-500 to-orange-600"
          >
            <div className="space-y-2.5">
              {suggestedQuestions.map((question, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    value={question}
                    onChange={(e) => updateQuestion(index, e.target.value)}
                    placeholder={`Suggested question ${index + 1}`}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => removeQuestion(index)}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
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
              className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-stone-50/50 px-4 text-sm font-medium text-stone-500 transition hover:border-stone-400 hover:bg-white hover:text-stone-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Question
            </button>
          </FormSection>
        </div>

        {/* Right Column — Preview + Actions */}
        <div className="space-y-5">
          {/* Live Preview */}
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-stone-100 bg-stone-50/60 px-5 py-3">
              <Eye className="h-4 w-4 text-stone-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Live Preview</span>
            </div>
            <div className="p-5">
              <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
                <div
                  className="rounded-xl px-4 py-4 text-sm shadow-sm"
                  style={{ backgroundColor: primaryColor, color: textColor }}
                >
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-75">
                    {brandName || "Brand Name"}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed">
                    {welcomeMessage || DEFAULT_WELCOME_MESSAGE}
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <PreviewStat label="Position" value={position} />
                  <PreviewStat
                    label="Questions"
                    value={String(suggestedQuestions.filter(q => q.trim()).length)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Embed Code */}
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/60 px-5 py-3">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Embed Code</span>
              <button
                type="button"
                onClick={handleCopyEmbedCode}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:border-stone-300 hover:text-stone-900"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="p-5">
              <pre className="overflow-x-auto rounded-xl bg-stone-950 p-4 text-xs leading-6 text-stone-300">
                {embedCode}
              </pre>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
                  <Rocket className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-stone-950">
                    Ready to deploy
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-stone-500">
                    Once created, you&apos;ll be redirected to the client workspace
                    to manage documents, analytics, and the live widget.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-5 text-sm font-semibold text-white shadow-lg shadow-stone-950/10 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Client"
                  )}
                </button>
                <Link
                  href="/clients"
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-stone-200 bg-white px-5 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:text-stone-950"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ─── Sub-components ─── */

const inputClass =
  "h-11 w-full rounded-2xl border border-stone-200 px-4 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:ring-4 focus:ring-stone-200/60";

function FormSection({
  icon,
  title,
  description,
  gradient,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-stone-100 bg-stone-50/60 px-5 py-3">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-white`}>
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-stone-900">{title}</h2>
          <p className="text-[11px] text-stone-400">{description}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
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
    <label className="block space-y-1.5">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-stone-600">
        {label}
        {required ? <span className="text-rose-500">*</span> : null}
      </span>
      {children}
      {hint ? <span className="block text-[11px] text-stone-400">{hint}</span> : null}
    </label>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-stone-100 bg-white px-3 py-2.5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{label}</div>
      <div className="mt-1 text-sm font-semibold text-stone-900">{value}</div>
    </div>
  );
}
