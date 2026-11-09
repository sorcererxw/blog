import "server-only";

import { listArticles } from "@/domains/article/list-articles";
import { buildOverviewFeedIndex } from "@/domains/feed/overview-feed";
import { listProjects } from "@/domains/projects/list-projects";
import { listThoughts } from "@/domains/thoughts/list-thoughts";
import { listStoredXSocialPosts } from "@/domains/social/x-sync";
import type { ProviderCache } from "@/integrations/kv/provider-cache";
import {
  createPublicProviderCache,
  withCachedArticleSource,
  withCachedProjectSource,
  withCachedThoughtProvider,
} from "@/integrations/kv/provider-wrappers";
import { createKvXSocialPostStore } from "@/integrations/kv/x-social-post-store";
import { createBlogArticleSource } from "@/integrations/notion/articles";
import { createNotionProjectSource, listProjectsFromNotion } from "@/integrations/notion/projects";
import { getWorkerEnv } from "@/lib/cloudflare-env";

export async function loadOverviewFeed(providerCache?: ProviderCache) {
  const [cache, env] = await Promise.all([
    providerCache ?? createPublicProviderCache(),
    getWorkerEnv(),
  ]);
  const articleSource = withCachedArticleSource(createBlogArticleSource(), cache);
  const projectSource = withCachedProjectSource(createNotionProjectSource(listProjectsFromNotion), cache);
  const thoughts = withCachedThoughtProvider(listThoughts, cache);
  const [articles, projects, thoughtItems, xPosts] = await Promise.all([
    listArticles({ source: articleSource }),
    listProjects({ source: projectSource }),
    thoughts(),
    env.BLOG_CACHE ? listStoredXSocialPosts(createKvXSocialPostStore(env.BLOG_CACHE)) : Promise.resolve([]),
  ]);
  return buildOverviewFeedIndex({ articles, projects, thoughts: thoughtItems, xPosts });
}
