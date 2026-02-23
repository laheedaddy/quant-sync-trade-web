import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:6001"}/:path*`,
      },
      {
        source: "/auth-api/:path*",
        destination: `${process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:6003"}/:path*`,
      },
      {
        source: "/console-api/:path*",
        destination: `${process.env.NEXT_PUBLIC_CONSOLE_API_URL || "http://localhost:6002"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
