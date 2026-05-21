import type { Metadata } from "next";

import { listArticles } from "@/domains/article/list-articles";
import {
  buildOverviewFeedIndex,
  parseFeedFilter,
} from "@/domains/feed/overview-feed";
import { serializeOverviewFeedItems } from "@/domains/feed/overview-feed-serialization";
import { listStoredXSocialPosts } from "@/domains/social/x-sync";
import { OverviewFeed } from "@/components/feed/overview-feed-view";
import { ProfileHero } from "@/components/home/profile-hero";
import {
  buildCollectionPageStructuredData,
  buildPersonStructuredData,
  buildWebsiteStructuredData,
} from "@/domains/seo/build-structured-data";
import { buildSeo } from "@/domains/seo/build-seo";
import { SITE_NAME } from "@/domains/seo/site";
import { listProjects } from "@/domains/projects/list-projects";
import { listThoughts } from "@/domains/thoughts/list-thoughts";
import {
  createPublicProviderCache,
  withCachedArticleSource,
  withCachedHomeSource,
  withCachedProjectSource,
  withCachedThoughtProvider,
} from "@/integrations/kv/provider-wrappers";
import { createKvXSocialPostStore } from "@/integrations/kv/x-social-post-store";
import { createBlogArticleSource } from "@/integrations/notion/articles";
import {
  createNotionHomeSource,
  getHomeDescription,
  loadNotionHomePage,
} from "@/integrations/notion/home";
import {
  createNotionProjectSource,
  listProjectsFromNotion,
} from "@/integrations/notion/projects";
import { getWorkerEnv } from "@/lib/cloudflare-env";

import { seoToMetadata, StructuredDataScripts } from "./seo";

export const revalidate = 600;

type HomeSearchParams = Promise<Record<string, string | string[] | undefined>>;

async function loadHomeData(searchParams?: Record<string, string | string[] | undefined>) {
  const providerCache = await createPublicProviderCache();
  const env = await getWorkerEnv();
  const homeSource = withCachedHomeSource(
    createNotionHomeSource(loadNotionHomePage),
    providerCache,
  );
  const articleSource = withCachedArticleSource(createBlogArticleSource(), providerCache);
  const projectSource = withCachedProjectSource(
    createNotionProjectSource(listProjectsFromNotion),
    providerCache,
  );
  const thoughtProvider = withCachedThoughtProvider(listThoughts, providerCache);
  const xPostsPromise = env.BLOG_CACHE
    ? listStoredXSocialPosts(createKvXSocialPostStore(env.BLOG_CACHE))
    : Promise.resolve([]);
  const [homePage, articles, projects, thoughts, xPosts] = await Promise.all([
    homeSource.loadHomePage(),
    listArticles({ source: articleSource }),
    listProjects({ source: projectSource }),
    thoughtProvider(),
    xPostsPromise,
  ]);
  const url = new URL("https://sorcererxw.com/");

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (typeof value === "string") {
      url.searchParams.set(key, value);
    }
  }

  const description = getHomeDescription(homePage.blocks) || "sorcererxw blog";
  const seoDescription =
    description === "sorcererxw blog"
      ? "A personal site overview with writing, projects, and public notes from sorcererxw."
      : description;
  const overviewFeedItems = buildOverviewFeedIndex({
    articles,
    projects,
    thoughts,
    xPosts,
  });
  const feedStructuredDataItems = overviewFeedItems
    .flatMap((item) => {
      if (item.destination.kind === "none") {
        return [];
      }

      const name = item.title || item.summary.replace(/\s+/g, " ").trim().slice(0, 90);

      if (!name) {
        return [];
      }

      return [
        {
          name,
          url: item.destination.href,
        },
      ];
    })
    .slice(0, 50);
  const seo = buildSeo({
    description: seoDescription,
    kind: "home",
    pathname: "/",
    structuredData: [
      buildWebsiteStructuredData(seoDescription),
      buildPersonStructuredData(seoDescription),
      ...buildCollectionPageStructuredData({
        description: seoDescription,
        items: feedStructuredDataItems,
        pathname: "/",
        title: "Personal Site overview feed",
      }),
    ],
    title: SITE_NAME,
  });

  return {
    feedItems: serializeOverviewFeedItems(overviewFeedItems),
    filter: parseFeedFilter(url),
    homePage,
    seo,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await loadHomeData();

  return seoToMetadata(seo);
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: HomeSearchParams;
}) {
  const params = await searchParams;
  const { feedItems, filter, homePage, seo } = await loadHomeData(params);

  return (
    <>
      <StructuredDataScripts seo={seo} />
      <ProfileHero blocks={homePage.blocks} />
      <OverviewFeed initialFilter={filter} items={feedItems} />
    </>
  );
}
