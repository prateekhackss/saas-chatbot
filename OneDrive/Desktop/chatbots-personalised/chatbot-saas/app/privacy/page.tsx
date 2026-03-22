import { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | NexusChat",
  description:
    "How NexusChat collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "March 22, 2026";
  const contactEmail = "privacy@nexuschat.prateekhacks.in";
  const siteUrl = "https://nexuschat.prateekhacks.in";

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#FAFAF9_0%,_#FFFFFF_36%,_#F5F5F4_100%)]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3 transition-transform hover:scale-105"
          >
            <Logo tone="light" size="md" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition hover:text-stone-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        {/* Title Block */}
        <div className="mb-16 border-b border-stone-200 pb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
            Legal
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-stone-950 sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm leading-6 text-stone-500">
            Effective date: {lastUpdated}
          </p>
        </div>

        {/* Intro */}
        <div className="space-y-32">
          <section>
            <p className="text-base leading-8 text-stone-600">
              NexusChat (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)
              operates the website at{" "}
              <a
                href={siteUrl}
                className="font-medium text-stone-900 underline decoration-stone-300 underline-offset-4 transition hover:decoration-stone-900"
              >
                {siteUrl}
              </a>{" "}
              and the NexusChat SaaS platform (the &ldquo;Service&rdquo;). This
              Privacy Policy explains how we collect, use, disclose, and safeguard
              your information when you use our Service.
            </p>
          </section>

          {/* ── Section 1 ── */}
          <section>
            <SectionHeading number="01" title="Information We Collect" />

            <div className="mt-10 space-y-10">
              <SubSection title="1.1 Account Information">
                <p>When you create an account, we collect:</p>
                <BulletList
                  items={[
                    "Email address",
                    "Full name (if provided)",
                    "Authentication credentials (managed securely by Supabase Auth)",
                    "OAuth profile data if you sign in via Google or GitHub",
                  ]}
                />
              </SubSection>

              <SubSection title="1.2 Billing Information">
                <p>
                  Payment processing is handled entirely by LemonSqueezy (which uses
                  Stripe as its payment processor). We do{" "}
                  <strong className="font-semibold text-stone-900">not</strong> store
                  credit card numbers, bank account details, or full payment
                  instrument data on our servers. We receive only:
                </p>
                <BulletList
                  items={[
                    "Subscription status and plan tier",
                    "LemonSqueezy subscription and customer identifiers",
                    "Transaction timestamps",
                  ]}
                />
              </SubSection>

              <SubSection title="1.3 Business Content You Upload">
                <p>
                  When you use the Service, you may upload documents, FAQs, product
                  information, and other business content (&ldquo;Training
                  Data&rdquo;) to train your AI chatbot. This data is stored in our
                  database and used solely to generate responses for your chatbot
                  widget.
                </p>
              </SubSection>

              <SubSection title="1.4 End-User Conversation Data">
                <p>
                  When visitors interact with chatbot widgets deployed on your
                  website, we collect:
                </p>
                <BulletList
                  items={[
                    "Conversation messages and timestamps",
                    "Session identifiers (anonymous, not personally identifiable)",
                    "Lead capture information (name and email) if voluntarily provided by the visitor",
                  ]}
                />
              </SubSection>

              <SubSection title="1.5 Automatically Collected Information">
                <BulletList
                  items={[
                    "IP addresses (for rate limiting and security; not stored long-term)",
                    "Browser type and device information (via standard HTTP headers)",
                    "Pages visited and feature usage patterns",
                  ]}
                />
              </SubSection>
            </div>
          </section>

          {/* ── Section 2 ── */}
          <section>
            <SectionHeading number="02" title="How We Use Your Information" />
            <div className="mt-10">
              <p className="text-base leading-8 text-stone-600">
                We use the collected information to:
              </p>
              <BulletList
                items={[
                  "Provide, maintain, and improve the Service",
                  "Process subscriptions and manage billing",
                  "Train and operate AI chatbots using your uploaded content",
                  "Send transactional emails (account verification, password resets, billing notifications)",
                  "Monitor for abuse, fraud, and security threats",
                  "Enforce our Terms of Service",
                  "Comply with legal obligations",
                ]}
              />
            </div>
          </section>

          {/* ── Section 3 ── */}
          <section>
            <SectionHeading number="03" title="Data Sharing and Third Parties" />
            <div className="mt-10 space-y-8">
              <p className="text-base leading-8 text-stone-600">
                We share data only with the following categories of service
                providers:
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <ThirdPartyCard
                  name="Supabase"
                  purpose="Database hosting, authentication, and file storage"
                />
                <ThirdPartyCard
                  name="LemonSqueezy / Stripe"
                  purpose="Payment processing"
                />
                <ThirdPartyCard
                  name="Groq"
                  purpose="AI inference for chatbot responses"
                />
                <ThirdPartyCard
                  name="Vercel"
                  purpose="Application hosting and edge functions"
                />
              </div>

              <p className="text-base leading-8 text-stone-600">
                We do{" "}
                <strong className="font-semibold text-stone-900">not</strong> sell,
                rent, or trade your personal information to third parties for
                marketing purposes. We may disclose information if required by law,
                court order, or governmental regulation.
              </p>
            </div>
          </section>

          {/* ── Section 4 ── */}
          <section>
            <SectionHeading number="04" title="Data Retention" />
            <div className="mt-10 space-y-6">
              <RetentionRow
                label="Active accounts"
                description="Data is retained for the duration of your account."
              />
              <RetentionRow
                label="Deleted accounts"
                description="When you delete your account, all personal data, chatbot configurations, documents, conversations, and leads are permanently deleted. We retain only a minimal audit record (email, account statistics) for fraud prevention and business analytics."
              />
              <RetentionRow
                label="Conversation data"
                description="Retained for the duration of the client account that owns the chatbot. End-users may request deletion through the chatbot operator (you)."
              />
            </div>
          </section>

          {/* ── Section 5 ── */}
          <section>
            <SectionHeading number="05" title="Data Security" />
            <div className="mt-10">
              <p className="mb-6 text-base leading-8 text-stone-600">
                We implement industry-standard security measures including:
              </p>
              <BulletList
                items={[
                  "TLS/SSL encryption for all data in transit",
                  "Row-Level Security (RLS) policies ensuring data isolation between accounts",
                  "HMAC signature verification for webhook endpoints",
                  "Secure authentication via Supabase Auth with bcrypt password hashing",
                  "Rate limiting on public API endpoints",
                  "Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy)",
                ]}
              />
            </div>
          </section>

          {/* ── Section 6 ── */}
          <section>
            <SectionHeading
              number="06"
              title="Your Rights (GDPR and International Users)"
            />
            <div className="mt-10 space-y-8">
              <p className="text-base leading-8 text-stone-600">
                If you are located in the European Economic Area (EEA), United
                Kingdom, or similar jurisdiction, you have the right to:
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <RightCard
                  right="Access"
                  description="Request a copy of your personal data"
                />
                <RightCard
                  right="Rectification"
                  description="Correct inaccurate personal data"
                />
                <RightCard
                  right="Erasure"
                  description="Delete your account and all associated data (available in Settings > Danger Zone)"
                />
                <RightCard
                  right="Portability"
                  description="Export your data in a structured format"
                />
                <RightCard
                  right="Restriction"
                  description="Limit how we process your data"
                />
                <RightCard
                  right="Objection"
                  description="Object to processing based on legitimate interests"
                />
              </div>

              <p className="text-base leading-8 text-stone-600">
                To exercise these rights, contact us at{" "}
                <a
                  href={`mailto:${contactEmail}`}
                  className="font-medium text-stone-900 underline decoration-stone-300 underline-offset-4 transition hover:decoration-stone-900"
                >
                  {contactEmail}
                </a>
                .
              </p>
            </div>
          </section>

          {/* ── Section 7 ── */}
          <section>
            <SectionHeading number="07" title="Cookies and Tracking" />
            <div className="mt-10">
              <p className="text-base leading-8 text-stone-600">
                We use essential cookies only for authentication session management
                (Supabase Auth tokens). We do{" "}
                <strong className="font-semibold text-stone-900">not</strong> use
                third-party tracking cookies, advertising pixels, or analytics
                services that track individual users across websites.
              </p>
            </div>
          </section>

          {/* ── Section 8 ── */}
          <section>
            <SectionHeading number="08" title="Children's Privacy" />
            <div className="mt-10">
              <p className="text-base leading-8 text-stone-600">
                The Service is not directed to individuals under the age of 16. We
                do not knowingly collect personal information from children. If you
                believe a child has provided us with personal data, please contact us
                and we will promptly delete it.
              </p>
            </div>
          </section>

          {/* ── Section 9 ── */}
          <section>
            <SectionHeading number="09" title="International Data Transfers" />
            <div className="mt-10">
              <p className="text-base leading-8 text-stone-600">
                Your data may be processed in countries other than your own,
                including the United States (where our infrastructure providers
                operate). By using the Service, you consent to such transfers. We
                ensure appropriate safeguards are in place through our service
                providers&apos; data processing agreements and compliance
                certifications.
              </p>
            </div>
          </section>

          {/* ── Section 10 ── */}
          <section>
            <SectionHeading number="10" title="Changes to This Policy" />
            <div className="mt-10">
              <p className="text-base leading-8 text-stone-600">
                We may update this Privacy Policy from time to time. We will notify
                you of material changes by posting the updated policy on this page
                and updating the &ldquo;Effective date&rdquo; above. Your continued
                use of the Service after changes constitutes acceptance of the
                revised policy.
              </p>
            </div>
          </section>

          {/* ── Section 11 ── */}
          <section>
            <SectionHeading number="11" title="Contact Us" />
            <div className="mt-10 rounded-2xl border border-stone-200 bg-white p-8">
              <p className="mb-6 text-base leading-8 text-stone-600">
                If you have questions about this Privacy Policy or wish to exercise
                your data rights, contact us at:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
                    Email
                  </span>
                  <a
                    href={`mailto:${contactEmail}`}
                    className="font-medium text-stone-900 underline decoration-stone-300 underline-offset-4 transition hover:decoration-stone-900"
                  >
                    {contactEmail}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
                    Web
                  </span>
                  <a
                    href={siteUrl}
                    className="font-medium text-stone-900 underline decoration-stone-300 underline-offset-4 transition hover:decoration-stone-900"
                  >
                    {siteUrl}
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="mt-20 border-t border-stone-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo tone="light" size="sm" />
          <div className="flex gap-6 text-sm text-stone-500">
            <Link href="/terms" className="transition hover:text-stone-900">
              Terms of Service
            </Link>
            <span className="text-stone-300">|</span>
            <span className="font-medium text-stone-700">Privacy Policy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Reusable Components ── */

function SectionHeading({ number, title }: { number: string; title: string }) {
  return (
    <div className="border-b border-stone-200 pb-6">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-rose-500/70">
        Section {number}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950 sm:text-3xl">
        {title}
      </h2>
    </div>
  );
}

function SubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-stone-800">{title}</h3>
      <div className="space-y-4 text-base leading-8 text-stone-600">
        {children}
      </div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-base leading-7 text-stone-600">
          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function ThirdPartyCard({
  name,
  purpose,
}: {
  name: string;
  purpose: string;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-5">
      <p className="text-sm font-semibold text-stone-900">{name}</p>
      <p className="mt-1 text-sm leading-6 text-stone-500">{purpose}</p>
    </div>
  );
}

function RetentionRow({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6">
      <p className="text-sm font-bold uppercase tracking-[0.15em] text-stone-400">
        {label}
      </p>
      <p className="mt-2 text-base leading-7 text-stone-600">{description}</p>
    </div>
  );
}

function RightCard({
  right,
  description,
}: {
  right: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-5">
      <p className="text-sm font-bold text-stone-900">{right}</p>
      <p className="mt-1 text-sm leading-6 text-stone-500">{description}</p>
    </div>
  );
}
