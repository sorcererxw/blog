import { getRuntimeInfo, getWorkerEnv } from "@/lib/cloudflare-env";
import { createLogger } from "@/lib/logger";

const healthLogger = createLogger("blog2:health");

export async function handleHealthRequest() {
  const runtime = getRuntimeInfo(await getWorkerEnv());

  healthLogger.info("health check", {
    app: runtime.app,
    mode: runtime.mode,
  });

  return Response.json({
    ok: true,
    runtime: {
      isDevelopment: runtime.isDevelopment,
      isProduction: runtime.isProduction,
      mode: runtime.mode,
    },
    service: "blog2",
  });
}
