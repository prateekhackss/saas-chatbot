import { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | NexusChat",
  description: "Terms and conditions for using NexusChat AI chatbot platform.",
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
          <h1 className="text-4xl font-bold tracking-tight text-stone-950">Terms of Service</h1>
          <p className="mt-3 text-sm text-stone-500">Last updated: {lastUpdated}</p>
        </div>

        <div className="prose prose-stone max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-6 prose-p:leading-7 prose-li:leading-7">

          <p>
            These Terms of Service (&quot;Terms&quot;) govern your access to and use of the NexusChat
            platform, website at <a href={siteUrl}>{siteUrl}</a>, and related services
            (collectively, the &quot;Service&quot;) operated by NexusChat (&quot;we,&quot; &quot;us,&quot;
            or &quot;our&quot;). By accessing or using the Service, you agree to be bound by these Terms.
          </p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By creating an account or using the Service, you confirm that you are at least 16 years of age
            and have the legal capacity to enter into a binding agreement. If you are using the Service on
            behalf of an organization, you represent that you have authority to bind that organization to
            these Terms.
          </p>

          <h2>2. Description of Service</h2>
          <p>NexusChat provides a SaaS platform that enables you to:</p>
          <ul>
            <li>Create and configure AI-powered chatbot assistants</li>
            <li>Upload business documents and knowledge bases to train chatbot responses</li>
            <li>Embed chatbot widgets on your websites via a JavaScript snippet</li>
            <li>Manage conversations, capture leads, and view analytics through a dashboard</li>
          </ul>

          <h2>3. Account Registration</h2>
          <ul>
            <li>You must provide accurate and complete information when creating an account.</li>
            <li>You are responsible for maintaining the security of your account credentials.</li>
            <li>You must notify us immediately of any unauthorized access to your account.</li>
            <li>One person or legal entity may not maintain more than one free trial account.</li>
          </ul>

          <h2>4. Subscription Plans and Billing</h2>

          <h3>4.1 Free Trial</h3>
          <p>
            New accounts are eligible for a 7-day free trial. During the trial, you have access to
            the features of your selected plan. No payment is required until the trial ends.
          </p>

          <h3>4.2 Paid Subscriptions</h3>
          <ul>
            <li>Subscriptions are billed monthly or annually through LemonSqueezy.</li>
            <li>Annual subscriptions receive a 17% discount compared to monthly billing.</li>
            <li>Prices are listed in USD and may be subject to applicable taxes.</li>
            <li>You authorize us to charge your payment method on a recurring basis until you cancel.</li>
          </ul>

          <h3>4.3 Plan Limits</h3>
          <p>
            Each plan has defined limits for messages, documents, and chatbots. If you exceed your
            plan&apos;s message limit in a billing cycle, chatbot responses may be paused until the
            next cycle or until you upgrade. We will provide advance warning before pausing service.
          </p>

          <h3>4.4 Cancellation and Refunds</h3>
          <ul>
            <li>You may cancel your subscription at any time from your account settings or through the LemonSqueezy customer portal.</li>
            <li>Cancellation takes effect at the end of the current billing period. You retain access until then.</li>
            <li>We do not offer prorated refunds for partial billing periods.</li>
            <li>If you believe a charge was made in error, contact us within 14 days.</li>
          </ul>

          <h2>5. Acceptable Use</h2>
          <p>You agree not to use the Service to:</p>
          <ul>
            <li>Violate any applicable law, regulation, or third-party rights</li>
            <li>Upload content that is illegal, defamatory, harassing, or obscene</li>
            <li>Impersonate any person or entity</li>
            <li>Distribute malware, spam, or phishing content through chatbot widgets</li>
            <li>Attempt to gain unauthorized access to our systems or other users&apos; accounts</li>
            <li>Use the Service for any purpose that competes directly with NexusChat</li>
            <li>Reverse-engineer, decompile, or attempt to extract source code from the Service</li>
            <li>Use automated tools to scrape, overload, or abuse the Service</li>
            <li>Circumvent rate limits, usage quotas, or other technical restrictions</li>
          </ul>

          <h2>6. Your Content</h2>

          <h3>6.1 Ownership</h3>
          <p>
            You retain all ownership rights to the content you upload to the Service (documents,
            business data, chatbot configurations). We do not claim ownership of your content.
          </p>

          <h3>6.2 License Grant</h3>
          <p>
            By uploading content, you grant us a limited, non-exclusive license to store, process,
            and use that content solely for the purpose of providing the Service (including AI
            inference and embedding generation). This license terminates when you delete the
            content or your account.
          </p>

          <h3>6.3 Responsibility</h3>
          <p>
            You are solely responsible for the content you upload and the responses your chatbot
            generates. You must ensure your content does not infringe any third-party intellectual
            property rights and complies with applicable laws.
          </p>

          <h2>7. AI-Generated Responses</h2>
          <ul>
            <li>Chatbot responses are generated by AI models based on your uploaded training data.</li>
            <li>AI responses may occasionally be inaccurate, incomplete, or contextually inappropriate.</li>
            <li>You acknowledge that AI-generated content should not be relied upon as professional, legal, medical, or financial advice.</li>
            <li>You are responsible for reviewing and monitoring your chatbot&apos;s responses to ensure accuracy and appropriateness for your use case.</li>
          </ul>

          <h2>8. Intellectual Property</h2>
          <p>
            The Service, including its design, code, features, branding, and documentation, is owned by
            NexusChat and protected by intellectual property laws. These Terms do not grant you any
            rights to our trademarks, logos, or brand assets except as necessary to use the Service.
          </p>

          <h2>9. Privacy</h2>
          <p>
            Your use of the Service is also governed by our{" "}
            <Link href="/privacy" className="text-rose-600 hover:text-rose-700">Privacy Policy</Link>,
            which describes how we collect, use, and protect your information. By using the Service,
            you consent to our data practices as described in the Privacy Policy.
          </p>

          <h2>10. Data Processing (For EEA/UK Users)</h2>
          <p>
            If you use the Service to process personal data of individuals in the European Economic Area
            or United Kingdom, you acknowledge that:
          </p>
          <ul>
            <li>You are the Data Controller for end-user data collected through your chatbot widgets.</li>
            <li>We act as a Data Processor on your behalf.</li>
            <li>You are responsible for obtaining appropriate consent from end-users and providing them with privacy notices as required by GDPR.</li>
          </ul>

          <h2>11. Service Availability</h2>
          <ul>
            <li>We strive to maintain high availability but do not guarantee uninterrupted service.</li>
            <li>We may perform scheduled maintenance with advance notice when possible.</li>
            <li>We are not liable for downtime caused by third-party service providers (Supabase, Vercel, Groq, LemonSqueezy).</li>
          </ul>

          <h2>12. Account Termination</h2>
          <ul>
            <li>You may delete your account at any time through Settings &gt; Danger Zone.</li>
            <li>We may suspend or terminate your account if you violate these Terms, with notice where practicable.</li>
            <li>Upon termination, your data will be deleted in accordance with our Privacy Policy.</li>
            <li>Provisions that by their nature should survive termination (limitations of liability, indemnification, governing law) will survive.</li>
          </ul>

          <h2>13. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law:
          </p>
          <ul>
            <li>
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of
              any kind, whether express, implied, or statutory, including implied warranties of
              merchantability, fitness for a particular purpose, and non-infringement.
            </li>
            <li>
              We shall not be liable for any indirect, incidental, special, consequential, or punitive
              damages, or any loss of profits, revenue, data, or business opportunities arising from
              your use of or inability to use the Service.
            </li>
            <li>
              Our total aggregate liability for any claims arising from these Terms or the Service
              shall not exceed the amount you paid us in the 12 months preceding the claim.
            </li>
          </ul>

          <h2>14. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless NexusChat and its officers, directors,
            employees, and agents from any claims, damages, liabilities, costs, or expenses (including
            reasonable legal fees) arising from:
          </p>
          <ul>
            <li>Your use of the Service</li>
            <li>Content you upload or your chatbot generates</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any third-party rights</li>
          </ul>

          <h2>15. Dispute Resolution</h2>
          <p>
            Any disputes arising from these Terms or the Service shall first be addressed through good-faith
            negotiation. If a resolution cannot be reached within 30 days, either party may pursue legal
            remedies. These Terms shall be governed by and construed in accordance with the laws of India,
            without regard to conflict of law principles.
          </p>

          <h2>16. Modifications to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will provide notice of material
            changes by posting the updated Terms on this page and updating the &quot;Last updated&quot;
            date. Your continued use of the Service after modifications constitutes acceptance of the
            revised Terms. If you do not agree with the changes, you must stop using the Service.
          </p>

          <h2>17. Severability</h2>
          <p>
            If any provision of these Terms is held to be invalid or unenforceable, the remaining
            provisions shall continue in full force and effect. The invalid provision shall be modified
            to the minimum extent necessary to make it valid and enforceable.
          </p>

          <h2>18. Entire Agreement</h2>
          <p>
            These Terms, together with the Privacy Policy, constitute the entire agreement between you
            and NexusChat regarding the Service and supersede all prior agreements, understandings, or
            representations.
          </p>

          <h2>19. Contact Us</h2>
          <p>
            If you have questions about these Terms, contact us at:
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
            <span className="font-medium text-stone-700">Terms of Service</span>
            <span className="text-stone-300">|</span>
            <Link href="/privacy" className="hover:text-stone-900 transition">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
