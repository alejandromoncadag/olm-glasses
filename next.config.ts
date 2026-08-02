import type { NextConfig } from "next";
import path from "path";

const catalogApiUrl = new URL(
  process.env.OPTICAOLM_CATALOG_API_URL || "http://127.0.0.1:8000"
);

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 100],
    remotePatterns: [
      {
        protocol: catalogApiUrl.protocol.replace(":", "") as "http" | "https",
        hostname: catalogApiUrl.hostname,
        port: catalogApiUrl.port,
        pathname: "/media/**",
      },
    ],
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;

