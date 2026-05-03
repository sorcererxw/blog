import type { APIRoute } from "astro";

import { getRuntimeConfig } from "@/config/runtime";
import { createLogger } from "@/lib/logger";

const healthLogger = createLogger("blog2:health");

export const prerender = false;

export const GET: APIRoute = async () => {
  const runtime = getRuntimeConfig();

  healthLogger.info("health check", {
    mode: runtime.mode,
    app: runtime.app,
  });

  return new Response(
    JSON.stringify({
      ok: true,
      service: "blog2",
      runtime: {
        mode: runtime.mode,
        isDevelopment: runtime.isDevelopment,
        isProduction: runtime.isProduction,
      },
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
};
