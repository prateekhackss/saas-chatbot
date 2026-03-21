/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Security headers applied to all routes
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "X-DNS-Prefetch-Control", value: "on" },
    ];

    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Chat API — CORS restricted to app URL
        source: "/api/chat",
        headers: [
          { key: "Access-Control-Allow-Origin", value: appUrl },
          { key: "Access-Control-Allow-Methods", value: "POST,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
      {
        // Embed config endpoint — needs to be accessible from client websites
        source: "/api/embed/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
      {
        // Widget iframe — must be embeddable on any domain (override X-Frame-Options)
        source: "/widget/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "X-Frame-Options", value: "ALLOWALL" },
        ],
      },
    ];
  },
};

export default nextConfig;
