import { createFileRoute } from "@tanstack/react-router";

import {
  handleApiCatalogGet,
  handleApiCatalogHead,
} from "@/server-handlers/api-catalog";

export const Route = createFileRoute("/.well-known/api-catalog")({
  server: {
    handlers: {
      GET: async () => handleApiCatalogGet(),
      HEAD: async () => handleApiCatalogHead(),
    },
  },
});
