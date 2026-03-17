/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/api/chat",
        headers: [
          // TODO: In production, restrict /api/chat CORS to only the hostUrl + known client domains
          // This requires querying the client's allowed_origins from the database
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
      {
        source: "/api/embed/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
      {
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
