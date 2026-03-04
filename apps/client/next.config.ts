import type { NextConfig } from "next";
import dotenv from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";

// Load root .env file (ESM-safe __dirname)
const __dirname = fileURLToPath(new URL(".", import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../.env") });

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*",
      },
    ];
  },
};

export default nextConfig;
