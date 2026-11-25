import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { Client } from "@xdevplatform/xdk";

import { syncXSocialPosts } from "@/domains/social/x-sync";
import { createKvXSocialPostStore } from "@/integrations/kv/x-social-post-store";
import { waitUntilInWorker } from "@/lib/cloudflare-env";
import { handleEdgeCachedFetch } from "@/lib/edge-page-cache";
import { getLegacyRedirectResponse } from "@/lib/legacy-redirects";
import { createLogger } from "@/lib/logger";
import type { CloudflareEnv } from "@/types/cloudflare";

const X_USER_ID = "3798600074";
const X_SYNC_CRON = "0 18 * * *";
const logger = createLogger("worker");

type ScheduledController = {
  cron: string;
};

type ExecutionContext = {
  waitUntil(promise: Promise<unknown>): void;
};

async function runXSocialPostSync(env: Partial<CloudflareEnv>) {
  if (!env.BLOG_CACHE) {
    logger.warn("skip X sync without BLOG_CACHE binding");
    return;
  }

  if (!env.X_SECRET) {
    logger.warn("skip X sync without X_SECRET secret");
    return;
  }

  const xClient = new Client({ bearerToken: env.X_SECRET });
  const result = await syncXSocialPosts({
    store: createKvXSocialPostStore(env.BLOG_CACHE),
    userId: X_USER_ID,
    xClient,
  });

  logger.info("X sync completed", result);
}

const serverEntry = createServerEntry({
  async fetch(request) {
    const redirectResponse = getLegacyRedirectResponse(request);
    if (redirectResponse) {
      return redirectResponse;
    }

    const cacheVersion =
      typeof __APP_BUILD_ID__ === "string" && __APP_BUILD_ID__
        ? __APP_BUILD_ID__
        : "v1";

    return handleEdgeCachedFetch({
      cacheVersion,
      context: { waitUntil: waitUntilInWorker },
      originFetch: async (originRequest) => handler.fetch(originRequest),
      request,
    });
  },
});

export default {
  ...serverEntry,
  scheduled(
    controller: ScheduledController,
    env: CloudflareEnv,
    context: ExecutionContext,
  ) {
    if (controller.cron === X_SYNC_CRON) {
      context.waitUntil(runXSocialPostSync(env));
    }
  },
};
