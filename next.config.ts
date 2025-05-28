// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "", // Leave empty for default HTTPS port (443)
        pathname: "/dx28ql7ig/**", // Restrict to your Cloudinary account
      },
    ],
  },
  serverExternalPackages: ["mongoose"], // Updated from experimental.serverComponentsExternalPackages
  output: "standalone", // Optimize for deployment
};

export default nextConfig;