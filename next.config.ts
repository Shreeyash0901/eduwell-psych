import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/eduwell-psych/dashboard",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
