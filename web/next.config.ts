import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The FalkorDB client (built on node-redis) must run as plain Node, not bundled.
  serverExternalPackages: ["falkordb", "@redis/client", "redis"],
};

export default nextConfig;
