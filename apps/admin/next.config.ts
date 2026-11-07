import type { NextConfig } from "next";

const backend = process.env.YESPIZ_API_ORIGIN ?? "http://127.0.0.1:3203";

const config: NextConfig = {
  distDir: process.env.YESPIZ_LOCAL_PILOT === "1" ? ".next/pilot" : ".next",
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: "/api/platform/:path*",
        destination: backend + "/platform/:path*",
      },
    ];
  },
};

export default config;
