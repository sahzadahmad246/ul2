import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "", // Leave empty for default HTTPS port (443)
        pathname: "/dx28ql7ig/**", // Optional: restrict to your Cloudinary account
      },
    ],
  },
};

export default nextConfig;
