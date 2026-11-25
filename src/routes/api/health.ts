import { createFileRoute } from "@tanstack/react-router";

import { handleHealthRequest } from "@/server-handlers/health";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => handleHealthRequest(),
    },
  },
});
