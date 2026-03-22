import { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | NexusChat",
  description: "How NexusChat collects, uses, and protects your personal information.",
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
          <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105">
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

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-stone-950">Privacy Policy</h1>
          <p className="mt-3 text-sm text-stone-500">Last updated: {lastUpdated}</p>
        </div>

        <div className="prose prose-stone max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-6 prose-p:leading-7 prose-li:leading-7">

          <p>
            NexusChat (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the website at{" "}
            <a href={siteUrl}>{siteUrl}</a> and the NexusChat SaaS platform (the &quot;Service&quot;).
            This Privacy Policy explains how we collect, use, disclose, and safeguard your
            information when you use our Service.
          </p>

          <h2>1. Information We Collect</h2>

          <h3>1.1 Account Information</h3>
          <p>When you create an account, we collect:</p>
          <ul>
            <li>Email address</li>
            <li>Full name (if provided)</li>
            <li>Authentication credentials (managed securely by Supabase Auth)</li>
            <li>OAuth profile data if you sign in via Google or GitHub</li>
          </ul>

          <h3>1.2 Billing Information</h3>
          <p>
            Payment processing is handled entirely by LemonSqueezy (which uses Stripe as its payment processor).
            We do <strong>not</strong> store credit card numbers, bank account details, or full payment
            instrument data on our servers. We receive only:
          </p>
          <ul>
            <li>Subscription status and plan tier</li>
            <li>LemonSqueezy subscription and customer identifiers</li>
            <li>Transaction timestamps</li>
          </ul>

          <h3>1.3 Business Content You Upload</h3>
          <p>
            When you use the Service, you may upload documents, FAQs, product information, and other
            business content (&quot;Training Data&quot;) to train your AI chatbot. This data is stored
            in our database and used solely to generate responses for your chatbot widget.
          </p>

          <h3>1.4 End-User Conversation Data</h3>
          <p>
            When visitors interact with chatbot widgets deployed on your website, we collect:
          </p>
          <ul>
            <li>Conversation messages and timestamps</li>
            <li>Session identifiers (anonymous, not personally identifiable)</li>
            <li>Lead capture information (name and email) if voluntarily provided by the visitor</li>
          </ul>

          <h3>1.5 Automatically Collected Information</h3>
          <ul>
            <li>IP addresses (for rate limiting and security; not stored long-term)</li>
            <li>Browser type and device information (via standard HTTP headers)</li>
            <li>Pages visited and feature usage patterns</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use the collected information to:</p>
          <ul>
            <li>Provide, maintain, and improve the Service</li>
            <li>Process subscriptions and manage billing</li>
            <li>Train and operate AI chatbots using your uploaded content</li>
            <li>Send transactional emails (account verification, password resets, billing notifications)</li>
            <li>Monitor for abuse, fraud, and security threats</li>
            <li>Enforce our Terms of Service</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2>3. Data Sharing and Third Parties</h2>
          <p>We share data only with the following categories of service providers:</p>
          <ul>
            <li><strong>Supabase</strong> — database hosting, authentication, and file storage</li>
            <li><strong>LemonSqueezy / Stripe</strong> — payment processing</li>
            <li><strong>Groq</strong> — AI inference for chatbot responses (conversation context is sent for processing)</li>
            <li><strong>Vercel</strong> — application hosting and edge functions</li>
          </ul>
          <p>
            We do <strong>not</strong> sell, rent, or trade your personal information to third parties
            for marketing purposes. We may disclose information if required by law, court order, or
            governmental regulation.
          </p>

          <h2>4. Data Retention</h2>
          <ul>
            <li><strong>Active accounts:</strong> Data is retained for the duration of your account.</li>
            <li><strong>Deleted accounts:</strong> When you delete your account, all personal data,
              chatbot configurations, documents, conversations, and leads are permanently deleted.
              We retain only a minimal audit record (email, account statistics) for fraud prevention
              and business analytics.</li>
            <li><strong>Conversation data:</strong> Retained for the duration of the client account
              that owns the chatbot. End-users may request deletion through the chatbot operator (you).</li>
          </ul>

          <h2>5. Data Security</h2>
          <p>We implement industry-standard security measures including:</p>
          <ul>
            <li>TLS/SSL encryption for all data in transit</li>
            <li>Row-Level Security (RLS) policies ensuring data isolation between accounts</li>
            <li>HMAC signature verification for webhook endpoints</li>
            <li>Secure authentication via Supabase Auth with bcrypt password hashing</li>
            <li>Rate limiting on public API endpoints</li>
            <li>Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy)</li>
          </ul>

          <h2>6. Your Rights (GDPR and International Users)</h2>
          <p>If you are located in the European Economic Area (EEA), United Kingdom, or similar jurisdiction, you have the right to:</p>
          <ul>
            <li><strong>Access</strong> — request a copy of your personal data</li>
            <li><strong>Rectification</strong> — correct inaccurate personal data</li>
            <li><strong>Erasure</strong> — delete your account and all associated data (available in Settings &gt; Danger Zone)</li>
            <li><strong>Portability</strong> — export your data in a structured format</li>
            <li><strong>Restriction</strong> — limit how we process your data</li>
            <li><strong>Objection</strong> — object to processing based on legitimate interests</li>
          </ul>
          <p>To exercise these rights, contact us at <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.</p>

          <h2>7. Cookies and Tracking</h2>
          <p>
            We use essential cookies only for authentication session management (Supabase Auth tokens).
            We do <strong>not</strong> use third-party tracking cookies, advertising pixels, or
            analytics services that track individual users across websites.
          </p>

          <h2>8. Children&apos;s Privacy</h2>
          <p>
            The Service is not directed to individuals under the age of 16. We do not knowingly
            collect personal information from children. If you believe a child has provided us with
            personal data, please contact us and we will promptly delete it.
          </p>

          <h2>9. International Data Transfers</h2>
          <p>
            Your data may be processed in countries other than your own, including the United States
            (where our infrastructure providers operate). By using the Service, you consent to such
            transfers. We ensure appropriate safeguards are in place through our service providers&apos;
            data processing agreements and compliance certifications.
          </p>

          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes
            by posting the updated policy on this page and updating the &quot;Last updated&quot; date.
            Your continued use of the Service after changes constitutes acceptance of the revised policy.
          </p>

          <h2>11. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or wish to exercise your data rights,
            contact us at:
          </p>
          <ul>
            <li>Email: <a href={`mailto:${contactEmail}`}>{contactEmail}</a></li>
            <li>Website: <a href={siteUrl}>{siteUrl}</a></li>
          </ul>
        </div>
      </main>

      <footer className="border-t border-stone-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Logo tone="light" size="sm" />
          <div className="flex gap-6 text-sm text-stone-500">
            <Link href="/terms" className="hover:text-stone-900 transition">Terms of Service</Link>
            <span className="text-stone-300">|</span>
            <span className="font-medium text-stone-700">Privacy Policy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
