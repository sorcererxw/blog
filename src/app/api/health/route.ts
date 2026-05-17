import { getRuntimeInfo, getWorkerEnv } from "@/lib/cloudflare-env";
import { createLogger } from "@/lib/logger";

const healthLogger = createLogger("blog2:health");

export const dynamic = "force-dynamic";

export async function GET() {
  const runtime = getRuntimeInfo(await getWorkerEnv());

  healthLogger.info("health check", {
    mode: runtime.mode,
    app: runtime.app,
  });

  return Response.json({
    ok: true,
    service: "blog2",
    runtime: {
      mode: runtime.mode,
      isDevelopment: runtime.isDevelopment,
      isProduction: runtime.isProduction,
    },
  });
}
