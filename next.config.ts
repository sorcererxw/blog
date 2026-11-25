import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

import { AGENT_DISCOVERY_LINK_HEADER } from "./src/domains/seo/agent-discovery";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["@heroui/react", "@heroui/styles", "lucide-react"],
  },
  images: {
    deviceSizes: [384, 640, 750, 1080, 1280],
    imageSizes: [40, 80, 256, 384],
    loader: "custom",
    loaderFile: "./image-loader.ts",
  },
  async headers() {
    return [
      {
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=600",
          },
          {
            key: "Link",
            value: AGENT_DISCOVERY_LINK_HEADER,
          },
        ],
      },
      {
        source: "/articles/:slug",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=600",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
