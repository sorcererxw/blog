import { createFileRoute } from "@tanstack/react-router";

import { handleCanonicalMediaRequest } from "@/server-handlers/canonical-media";

export const Route = createFileRoute("/media/$id")({
  server: {
    handlers: {
      GET: async ({ params, request }) =>
        handleCanonicalMediaRequest(request, params.id),
    },
  },
});
