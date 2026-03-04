import type { NextConfig } from "next";
import dotenv from "dotenv";
import { resolve } from "path";

// Load root .env (when run from apps/client, cwd is apps/client)
dotenv.config({ path: resolve(process.cwd(), "../../.env") });

const nextConfig: NextConfig = {

  allowedDevOrigins: ["*"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*",
      },
    ];
  },
  reactCompiler: true,
};

export default nextConfig;
