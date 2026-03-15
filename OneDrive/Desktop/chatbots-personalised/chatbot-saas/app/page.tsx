import Link from 'next/link';
import { Bot, Zap, Shield, Sparkles, MessageSquare, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-200">
      
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold tracking-tight text-slate-900">ChatbaseClone</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
            <Link href="#features" className="hover:text-slate-900 transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Sign In
            </Link>
            <Link href="/clients" className="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32">
          {/* Decorative background blobs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] opacity-30 pointer-events-none">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          </div>

          <div className="container relative z-10 mx-auto px-4 text-center">
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800 mb-8">
              <Sparkles className="h-4 w-4 mr-2" />
              Llama 3.3 70B Powered Intelligence
            </div>
            <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-slate-900 sm:text-7xl">
              Custom AI Chatbots <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Trained on Your Data.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 leading-relaxed">
              Upload your documents, website links, or PDFs. We generate a custom ChatGPT-like widget you can embed onto your website in seconds. No coding required.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/clients/new" className="inline-flex h-12 items-center justify-center rounded-lg bg-blue-600 px-8 text-sm font-medium text-white shadow-xl shadow-blue-200 transition-colors hover:bg-blue-700 hover:-translate-y-0.5 transform duration-200 w-full sm:w-auto">
                Build Your Chatbot <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="#demo" className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-8 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-50 hover:-translate-y-0.5 transform duration-200 w-full sm:w-auto">
                View Live Demo
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-white border-y border-slate-100">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Everything you need to automate support</h2>
              <p className="mt-4 text-lg text-slate-600">Our RAG (Retrieval-Augmented Generation) pipeline ensures your bot only answers based on *your* exact business knowledge.</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="group relative rounded-2xl border border-slate-200 p-8 shadow-sm transition-shadow hover:shadow-md bg-slate-50 hover:bg-white">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100/80 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-900">Instant Answers</h3>
                <p className="text-slate-600 leading-relaxed">Deflect up to 70% of routine customer support tickets with sub-second response times using Llama 3.3.</p>
              </div>

              {/* Feature 2 */}
              <div className="group relative rounded-2xl border border-slate-200 p-8 shadow-sm transition-shadow hover:shadow-md bg-slate-50 hover:bg-white">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100/80 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-900">No Hallucinations</h3>
                <p className="text-slate-600 leading-relaxed">Strict systemic prompt boundaries ensure the bot will proudly say "I don't know" rather than inventing false facts.</p>
              </div>

              {/* Feature 3 */}
              <div className="group relative rounded-2xl border border-slate-200 p-8 shadow-sm transition-shadow hover:shadow-md bg-slate-50 hover:bg-white">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100/80 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-900">1-Minute Integration</h3>
                <p className="text-slate-600 leading-relaxed">Just copy and paste a single <code>&lt;script&gt;</code> tag into your website's HTML. Works natively with WordPress, Shopify, and React.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Simple, transparent pricing</h2>
              <p className="mt-4 text-lg text-slate-600">Start for free, upgrade when you need more power.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free Plan */}
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <h3 className="text-2xl font-bold text-slate-900">Hobby</h3>
                <div className="mt-4 flex items-baseline text-5xl font-extrabold text-slate-900">
                  $0
                  <span className="ml-1 text-xl font-medium text-slate-500">/mo</span>
                </div>
                <p className="mt-4 text-slate-600">Perfect for personal blogs and testing.</p>
                <ul className="mt-8 space-y-4">
                  {['1 Chatbot Widget', '400,000 characters / chatbot', '1,000 messages / month', 'Standard Support'].map((feature) => (
                    <li key={feature} className="flex items-center">
                      <CheckCircle2 className="h-5 w-5 text-blue-500 mr-3 shrink-0" />
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/clients/new" className="mt-8 block w-full rounded-lg border-2 border-slate-200 bg-white px-6 py-3 text-center font-medium text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-50">
                  Get Started Free
                </Link>
              </div>

              {/* Pro Plan */}
              <div className="rounded-3xl border-2 border-blue-600 bg-slate-900 p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -transtale-y-1/2 translate-x-1/3 w-64 h-64 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
                <h3 className="text-2xl font-bold text-white">Growth</h3>
                <div className="mt-4 flex items-baseline text-5xl font-extrabold text-white">
                  $49
                  <span className="ml-1 text-xl font-medium text-slate-400">/mo</span>
                </div>
                <p className="mt-4 text-slate-300">For businesses that need maximum engagement.</p>
                <ul className="mt-8 space-y-4">
                  {['10 Chatbot Widgets', '11,000,000 characters / chatbot', '10,000 messages / month', 'Remove "Powered By" Branding', 'Analytics Dashboard'].map((feature) => (
                    <li key={feature} className="flex items-center">
                      <CheckCircle2 className="h-5 w-5 text-blue-400 mr-3 shrink-0" />
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/clients/new" className="mt-8 block w-full rounded-lg bg-blue-600 px-6 py-3 text-center font-medium text-white transition-colors hover:bg-blue-500 shadow-lg shadow-blue-900/50">
                  Upgrade to Growth
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-slate-900" />
            <span className="text-lg font-bold text-slate-900">ChatbaseClone</span>
          </div>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} ChatbaseClone Inc. All rights reserved. Built for demonstration.
          </p>
        </div>
      </footer>
    </div>
  );
}
