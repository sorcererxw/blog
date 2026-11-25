import { listArticles } from "@/domains/article/list-articles";
import { buildOverviewFeedIndex } from "@/domains/feed/overview-feed";
import { serializeOverviewFeedItems } from "@/domains/feed/overview-feed-serialization";
import { listProjects } from "@/domains/projects/list-projects";
import { buildSeo } from "@/domains/seo/build-seo";
import {
  buildCollectionPageStructuredData,
  buildPersonStructuredData,
  buildWebsiteStructuredData,
} from "@/domains/seo/build-structured-data";
import { SITE_NAME } from "@/domains/seo/site";
import { listStoredXSocialPosts } from "@/domains/social/x-sync";
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
  type HomePageRecord,
} from "@/integrations/notion/home";
import {
  createNotionProjectSource,
  listProjectsFromNotion,
} from "@/integrations/notion/projects";
import { getWorkerEnv } from "@/lib/cloudflare-env";

const FALLBACK_HOME_DESCRIPTION =
  "A personal site overview with writing, projects, and public notes from sorcererxw.";

export function getHomeSeoDescription(homePage: HomePageRecord) {
  const description = getHomeDescription(homePage.blocks) || "sorcererxw blog";

  return description === "sorcererxw blog"
    ? FALLBACK_HOME_DESCRIPTION
    : description;
}

export function buildHomePageSeo({
  feedStructuredDataItems,
  homePage,
}: {
  feedStructuredDataItems: Array<{ name: string; url: string }>;
  homePage: HomePageRecord;
}) {
  const seoDescription = getHomeSeoDescription(homePage);

  return buildSeo({
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
}

export async function loadHomePageData() {
  const providerCache = await createPublicProviderCache();
  const env = await getWorkerEnv();
  const homeSource = withCachedHomeSource(
    createNotionHomeSource(loadNotionHomePage),
    providerCache,
  );
  const articleSource = withCachedArticleSource(
    createBlogArticleSource(),
    providerCache,
  );
  const projectSource = withCachedProjectSource(
    createNotionProjectSource(listProjectsFromNotion),
    providerCache,
  );
  const thoughtProvider = withCachedThoughtProvider(
    listThoughts,
    providerCache,
  );
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

      const name =
        item.title || item.summary.replace(/\s+/g, " ").trim().slice(0, 90);

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

  const seo = buildHomePageSeo({
    feedStructuredDataItems,
    homePage,
  });

  return {
    feedItems: serializeOverviewFeedItems(overviewFeedItems),
    homePage,
    seo,
  };
}
