import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 100],
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;

