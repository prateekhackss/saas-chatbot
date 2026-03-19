import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
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
