/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return [
      {
        // Chat API — CORS handled dynamically in the route handler itself
        // to validate against each client's allowedOrigins config.
        // These headers are a fallback for the widget iframe embedding.
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
        // Widget iframe — must be embeddable on any domain
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
