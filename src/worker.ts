// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- `.open-next/worker.js` may not exist before the OpenNext build.
// @ts-ignore
import handler from "../.open-next/worker.js";
import { Client } from "@xdevplatform/xdk";

import { syncXSocialPosts } from "@/domains/social/x-sync";
import { createKvXSocialPostStore } from "@/integrations/kv/x-social-post-store";
import { handleEdgeCachedFetch } from "@/lib/edge-page-cache";
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

let cachedBuildVersionPromise: Promise<string> | null = null;

function getBuildVersion(env: Partial<CloudflareEnv>): Promise<string> {
  if (cachedBuildVersionPromise) {
    return cachedBuildVersionPromise;
  }

  const assets = env.ASSETS;
  if (!assets || typeof assets.fetch !== "function") {
    return Promise.resolve("v1");
  }

  cachedBuildVersionPromise = assets
    .fetch(new Request("https://assets.local/BUILD_ID"))
    .then(async (response) => {
      if (!response.ok) {
        return "v1";
      }

      const id = (await response.text()).trim();
      return id || "v1";
    })
    .catch(() => "v1");

  return cachedBuildVersionPromise;
}

export default {
  async fetch(request: Request, env: CloudflareEnv, context: ExecutionContext) {
    const cacheVersion = await getBuildVersion(env);

    return handleEdgeCachedFetch({
      cacheVersion,
      context,
      originFetch: (originRequest) => handler.fetch(originRequest, env, context),
      request,
    });
  },
  scheduled(controller: ScheduledController, env: CloudflareEnv, context: ExecutionContext) {
    if (controller.cron === X_SYNC_CRON) {
      context.waitUntil(runXSocialPostSync(env));
    }
  },
};
