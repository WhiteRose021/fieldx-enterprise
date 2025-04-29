import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://192.168.4.20:4000/:path*",
      },
      {
        source: '/ws/:path*',
        destination: 'http://localhost:4000/ws/:path*' // WebSocket endpoint
      }
    ];
  },
  experimental: {
    turbo: {
      resolveAlias: {},
    },
    allowedDevOrigins: [
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      "http://192.168.4.20:3001",
      "http://localhost:3002",
      "http://127.0.0.1:3002",
      "http://192.168.4.20:3002",
    ]
  },
  // Add CORS headers
  async headers() {
    return [
      {
        source: "/_next/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ]
      }
    ];
  },
};

export default nextConfig;