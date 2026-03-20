import type { Metadata } from "next";
import localFont from "next/font/local";
import { Archivo_Black, Sora } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast-provider";

const archivo = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-archivo",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "NexusChat - AI Customer Support Chatbots",
  description:
    "Deploy custom AI chatbots trained on your business content. Instant setup, polished embeds, and fast support workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} ${sora.variable} antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
        {/* Nexus Chat widget — live demo on our own site */}
        <script
          src="https://nexuschat.prateekhacks.in/embed.js"
          data-client="nexus-chat"
          async
        />
      </body>
    </html>
  );
}
