import { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | NexusChat",
  description:
    "Terms and conditions for using NexusChat AI chatbot platform.",
};

export default function TermsOfServicePage() {
  const lastUpdated = "March 22, 2026";
  const contactEmail = "legal@nexuschat.prateekhacks.in";
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
            Terms of Service
          </h1>
          <p className="mt-4 text-sm leading-6 text-stone-500">
            Effective date: {lastUpdated}
          </p>
        </div>

        {/* Intro */}
        <div className="space-y-32">
          <section>
            <p className="text-base leading-8 text-stone-600">
              These Terms of Service (&ldquo;Terms&rdquo;) govern your access to
              and use of the NexusChat platform, website at{" "}
              <a
                href={siteUrl}
                className="font-medium text-stone-900 underline decoration-stone-300 underline-offset-4 transition hover:decoration-stone-900"
              >
                {siteUrl}
              </a>
              , and related services (collectively, the &ldquo;Service&rdquo;)
              operated by NexusChat (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
              &ldquo;our&rdquo;). By accessing or using the Service, you agree to
              be bound by these Terms.
            </p>
          </section>

          {/* ── Section 1 ── */}
          <section>
            <SectionHeading number="01" title="Acceptance of Terms" />
            <div className="mt-10">
              <p className="text-base leading-8 text-stone-600">
                By creating an account or using the Service, you confirm that you
                are at least 16 years of age and have the legal capacity to enter
                into a binding agreement. If you are using the Service on behalf of
                an organization, you represent that you have authority to bind that
                organization to these Terms.
              </p>
            </div>
          </section>

          {/* ── Section 2 ── */}
          <section>
            <SectionHeading number="02" title="Description of Service" />
            <div className="mt-10">
              <p className="mb-6 text-base leading-8 text-stone-600">
                NexusChat provides a SaaS platform that enables you to:
              </p>
              <BulletList
                items={[
                  "Create and configure AI-powered chatbot assistants",
                  "Upload business documents and knowledge bases to train chatbot responses",
                  "Embed chatbot widgets on your websites via a JavaScript snippet",
                  "Manage conversations, capture leads, and view analytics through a dashboard",
                ]}
              />
            </div>
          </section>

          {/* ── Section 3 ── */}
          <section>
            <SectionHeading number="03" title="Account Registration" />
            <div className="mt-10">
              <BulletList
                items={[
                  "You must provide accurate and complete information when creating an account.",
                  "You are responsible for maintaining the security of your account credentials.",
                  "You must notify us immediately of any unauthorized access to your account.",
                  "One person or legal entity may not maintain more than one free trial account.",
                ]}
              />
            </div>
          </section>

          {/* ── Section 4 ── */}
          <section>
            <SectionHeading number="04" title="Subscription Plans and Billing" />

            <div className="mt-10 space-y-10">
              <SubSection title="4.1 Free Trial">
                <p>
                  New accounts are eligible for a 7-day free trial. During the
                  trial, you have access to the features of your selected plan. No
                  payment is required until the trial ends.
                </p>
              </SubSection>

              <SubSection title="4.2 Paid Subscriptions">
                <BulletList
                  items={[
                    "Subscriptions are billed monthly or annually through LemonSqueezy.",
                    "Annual subscriptions receive a 17% discount compared to monthly billing.",
                    "Prices are listed in USD and may be subject to applicable taxes.",
                    "You authorize us to charge your payment method on a recurring basis until you cancel.",
                  ]}
                />
              </SubSection>

              <SubSection title="4.3 Plan Limits">
                <p>
                  Each plan has defined limits for messages, documents, and
                  chatbots. If you exceed your plan&apos;s message limit in a
                  billing cycle, chatbot responses may be paused until the next
                  cycle or until you upgrade. We will provide advance warning before
                  pausing service.
                </p>
              </SubSection>

              <SubSection title="4.4 Cancellation and Refunds">
                <BulletList
                  items={[
                    "You may cancel your subscription at any time from your account settings or through the LemonSqueezy customer portal.",
                    "Cancellation takes effect at the end of the current billing period. You retain access until then.",
                    "We do not offer prorated refunds for partial billing periods.",
                    "If you believe a charge was made in error, contact us within 14 days.",
                  ]}
                />
              </SubSection>
            </div>
          </section>

          {/* ── Section 5 ── */}
          <section>
            <SectionHeading number="05" title="Acceptable Use" />
            <div className="mt-10">
              <p className="mb-6 text-base leading-8 text-stone-600">
                You agree not to use the Service to:
              </p>
              <BulletList
                items={[
                  "Violate any applicable law, regulation, or third-party rights",
                  "Upload content that is illegal, defamatory, harassing, or obscene",
                  "Impersonate any person or entity",
                  "Distribute malware, spam, or phishing content through chatbot widgets",
                  "Attempt to gain unauthorized access to our systems or other users' accounts",
                  "Use the Service for any purpose that competes directly with NexusChat",
                  "Reverse-engineer, decompile, or attempt to extract source code from the Service",
                  "Use automated tools to scrape, overload, or abuse the Service",
                  "Circumvent rate limits, usage quotas, or other technical restrictions",
                ]}
              />
            </div>
          </section>

          {/* ── Section 6 ── */}
          <section>
            <SectionHeading number="06" title="Your Content" />

            <div className="mt-10 space-y-10">
              <SubSection title="6.1 Ownership">
                <p>
                  You retain all ownership rights to the content you upload to the
                  Service (documents, business data, chatbot configurations). We do
                  not claim ownership of your content.
                </p>
              </SubSection>

              <SubSection title="6.2 License Grant">
                <p>
                  By uploading content, you grant us a limited, non-exclusive
                  license to store, process, and use that content solely for the
                  purpose of providing the Service (including AI inference and
                  embedding generation). This license terminates when you delete the
                  content or your account.
                </p>
              </SubSection>

              <SubSection title="6.3 Responsibility">
                <p>
                  You are solely responsible for the content you upload and the
                  responses your chatbot generates. You must ensure your content
                  does not infringe any third-party intellectual property rights and
                  complies with applicable laws.
                </p>
              </SubSection>
            </div>
          </section>

          {/* ── Section 7 ── */}
          <section>
            <SectionHeading number="07" title="AI-Generated Responses" />
            <div className="mt-10">
              <BulletList
                items={[
                  "Chatbot responses are generated by AI models based on your uploaded training data.",
                  "AI responses may occasionally be inaccurate, incomplete, or contextually inappropriate.",
                  "You acknowledge that AI-generated content should not be relied upon as professional, legal, medical, or financial advice.",
                  "You are responsible for reviewing and monitoring your chatbot's responses to ensure accuracy and appropriateness for your use case.",
                ]}
              />
            </div>
          </section>

          {/* ── Section 8 ── */}
          <section>
            <SectionHeading number="08" title="Intellectual Property" />
            <div className="mt-10">
              <p className="text-base leading-8 text-stone-600">
                The Service, including its design, code, features, branding, and
                documentation, is owned by NexusChat and protected by intellectual
                property laws. These Terms do not grant you any rights to our
                trademarks, logos, or brand assets except as necessary to use the
                Service.
              </p>
            </div>
          </section>

          {/* ── Section 9 ── */}
          <section>
            <SectionHeading number="09" title="Privacy" />
            <div className="mt-10">
              <p className="text-base leading-8 text-stone-600">
                Your use of the Service is also governed by our{" "}
                <Link
                  href="/privacy"
                  className="font-medium text-rose-600 underline decoration-rose-300 underline-offset-4 transition hover:decoration-rose-600"
                >
                  Privacy Policy
                </Link>
                , which describes how we collect, use, and protect your
                information. By using the Service, you consent to our data
                practices as described in the Privacy Policy.
              </p>
            </div>
          </section>

          {/* ── Section 10 ── */}
          <section>
            <SectionHeading
              number="10"
              title="Data Processing (For EEA/UK Users)"
            />
            <div className="mt-10 space-y-6">
              <p className="text-base leading-8 text-stone-600">
                If you use the Service to process personal data of individuals in
                the European Economic Area or United Kingdom, you acknowledge that:
              </p>
              <BulletList
                items={[
                  "You are the Data Controller for end-user data collected through your chatbot widgets.",
                  "We act as a Data Processor on your behalf.",
                  "You are responsible for obtaining appropriate consent from end-users and providing them with privacy notices as required by GDPR.",
                ]}
              />
            </div>
          </section>

          {/* ── Section 11 ── */}
          <section>
            <SectionHeading number="11" title="Service Availability" />
            <div className="mt-10">
              <BulletList
                items={[
                  "We strive to maintain high availability but do not guarantee uninterrupted service.",
                  "We may perform scheduled maintenance with advance notice when possible.",
                  "We are not liable for downtime caused by third-party service providers (Supabase, Vercel, Groq, LemonSqueezy).",
                ]}
              />
            </div>
          </section>

          {/* ── Section 12 ── */}
          <section>
            <SectionHeading number="12" title="Account Termination" />
            <div className="mt-10">
              <BulletList
                items={[
                  "You may delete your account at any time through Settings > Danger Zone.",
                  "We may suspend or terminate your account if you violate these Terms, with notice where practicable.",
                  "Upon termination, your data will be deleted in accordance with our Privacy Policy.",
                  "Provisions that by their nature should survive termination (limitations of liability, indemnification, governing law) will survive.",
                ]}
              />
            </div>
          </section>

          {/* ── Section 13 ── */}
          <section>
            <SectionHeading number="13" title="Limitation of Liability" />
            <div className="mt-10 space-y-6 rounded-2xl border border-stone-200 bg-stone-50 p-8">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-stone-400">
                To the maximum extent permitted by applicable law:
              </p>

              <div className="space-y-6">
                <p className="text-base leading-8 text-stone-600">
                  The Service is provided &ldquo;as is&rdquo; and &ldquo;as
                  available&rdquo; without warranties of any kind, whether express,
                  implied, or statutory, including implied warranties of
                  merchantability, fitness for a particular purpose, and
                  non-infringement.
                </p>

                <p className="text-base leading-8 text-stone-600">
                  We shall not be liable for any indirect, incidental, special,
                  consequential, or punitive damages, or any loss of profits,
                  revenue, data, or business opportunities arising from your use of
                  or inability to use the Service.
                </p>

                <p className="text-base leading-8 text-stone-600">
                  Our total aggregate liability for any claims arising from these
                  Terms or the Service shall not exceed the amount you paid us in
                  the 12 months preceding the claim.
                </p>
              </div>
            </div>
          </section>

          {/* ── Section 14 ── */}
          <section>
            <SectionHeading number="14" title="Indemnification" />
            <div className="mt-10 space-y-6">
              <p className="text-base leading-8 text-stone-600">
                You agree to indemnify, defend, and hold harmless NexusChat and its
                officers, directors, employees, and agents from any claims, damages,
                liabilities, costs, or expenses (including reasonable legal fees)
                arising from:
              </p>
              <BulletList
                items={[
                  "Your use of the Service",
                  "Content you upload or your chatbot generates",
                  "Your violation of these Terms",
                  "Your violation of any third-party rights",
                ]}
              />
            </div>
          </section>

          {/* ── Section 15 ── */}
          <section>
            <SectionHeading number="15" title="Dispute Resolution" />
            <div className="mt-10">
              <p className="text-base leading-8 text-stone-600">
                Any disputes arising from these Terms or the Service shall first be
                addressed through good-faith negotiation. If a resolution cannot be
                reached within 30 days, either party may pursue legal remedies.
                These Terms shall be governed by and construed in accordance with
                the laws of India, without regard to conflict of law principles.
              </p>
            </div>
          </section>

          {/* ── Section 16 ── */}
          <section>
            <SectionHeading number="16" title="Modifications to Terms" />
            <div className="mt-10">
              <p className="text-base leading-8 text-stone-600">
                We reserve the right to modify these Terms at any time. We will
                provide notice of material changes by posting the updated Terms on
                this page and updating the &ldquo;Effective date&rdquo; above. Your
                continued use of the Service after modifications constitutes
                acceptance of the revised Terms. If you do not agree with the
                changes, you must stop using the Service.
              </p>
            </div>
          </section>

          {/* ── Section 17 ── */}
          <section>
            <SectionHeading number="17" title="Severability" />
            <div className="mt-10">
              <p className="text-base leading-8 text-stone-600">
                If any provision of these Terms is held to be invalid or
                unenforceable, the remaining provisions shall continue in full force
                and effect. The invalid provision shall be modified to the minimum
                extent necessary to make it valid and enforceable.
              </p>
            </div>
          </section>

          {/* ── Section 18 ── */}
          <section>
            <SectionHeading number="18" title="Entire Agreement" />
            <div className="mt-10">
              <p className="text-base leading-8 text-stone-600">
                These Terms, together with the Privacy Policy, constitute the entire
                agreement between you and NexusChat regarding the Service and
                supersede all prior agreements, understandings, or representations.
              </p>
            </div>
          </section>

          {/* ── Section 19 ── */}
          <section>
            <SectionHeading number="19" title="Contact Us" />
            <div className="mt-10 rounded-2xl border border-stone-200 bg-white p-8">
              <p className="mb-6 text-base leading-8 text-stone-600">
                If you have questions about these Terms, contact us at:
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
            <span className="font-medium text-stone-700">Terms of Service</span>
            <span className="text-stone-300">|</span>
            <Link href="/privacy" className="transition hover:text-stone-900">
              Privacy Policy
            </Link>
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
        <li
          key={item}
          className="flex items-start gap-3 text-base leading-7 text-stone-600"
        >
          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
          {item}
        </li>
      ))}
    </ul>
  );
}
