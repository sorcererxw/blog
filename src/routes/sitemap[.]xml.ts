import { createFileRoute } from "@tanstack/react-router";

import { handleSitemapRequest } from "@/server-handlers/sitemap";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => handleSitemapRequest(),
    },
  },
});
