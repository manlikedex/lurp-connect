import type { NextConfig } from "next";

const nextConfig = {
  allowedDevOrigins: ["192.168.56.1"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
    ],
  },
};

export default nextConfig;