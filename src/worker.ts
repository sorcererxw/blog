// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- `.open-next/worker.js` may not exist before the OpenNext build.
// @ts-ignore
import handler from "../.open-next/worker.js";
import { syncXSocialPosts } from "@/domains/social/x-sync";
import { createKvXSocialPostStore } from "@/integrations/kv/x-social-post-store";
import { createXUserPostsSource } from "@/integrations/x/user-posts";
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

  const result = await syncXSocialPosts({
    fetchPosts: createXUserPostsSource({
      bearerToken: env.X_SECRET,
      userId: X_USER_ID,
    }).fetchPosts,
    store: createKvXSocialPostStore(env.BLOG_CACHE),
  });

  logger.info("X sync completed", result);
}

export default {
  fetch: handler.fetch,
  scheduled(controller: ScheduledController, env: CloudflareEnv, context: ExecutionContext) {
    if (controller.cron === X_SYNC_CRON) {
      context.waitUntil(runXSocialPostSync(env));
    }
  },
};
