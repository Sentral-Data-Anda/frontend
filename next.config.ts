import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  allowedDevOrigins: ["http://172.16.122.26:3000"],

  reactStrictMode: false,

  async redirects() {
    return [
      {
        source: "/api/auth/signin",
        destination: "/login",
        permanent: true,
      },
      {
        source: "/auth/login",
        destination: "/login",
        permanent: true,
      },
      {
        source: "/",
        destination: "/authentication",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
