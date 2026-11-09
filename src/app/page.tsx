import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { listArticles } from "@/domains/article/list-articles";
import { buildOverviewFeedIndex } from "@/domains/feed/overview-feed";
import {
  getFeedRequest,
  getFeedCanonicalPath,
  paginateFeed,
  type FeedSearchParams,
} from "@/domains/feed/feed-pagination";
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
  type HomePageRecord,
} from "@/integrations/notion/home";
import {
  createNotionProjectSource,
  listProjectsFromNotion,
} from "@/integrations/notion/projects";
import { getWorkerEnv } from "@/lib/cloudflare-env";

import { seoToMetadata, StructuredDataScripts } from "./seo";

export const revalidate = 600;

type HomeSearchParams = Promise<FeedSearchParams>;

const FALLBACK_HOME_DESCRIPTION =
  "A personal site overview with writing, projects, and public notes from sorcererxw.";

const getHomeSeoDescription = (homePage: HomePageRecord) => {
  const description = getHomeDescription(homePage.blocks) || "sorcererxw blog";

  return description === "sorcererxw blog"
    ? FALLBACK_HOME_DESCRIPTION
    : description;
};

const buildHomeMetadataSeo = (homePage: HomePageRecord, pathname = "/") =>
  buildSeo({
    description: getHomeSeoDescription(homePage),
    kind: "home",
    pathname,
    title: SITE_NAME,
  });

const buildHomePageSeo = ({
  feedStructuredDataItems,
  homePage,
  pathname,
}: {
  feedStructuredDataItems: Array<{ name: string; url: string }>;
  homePage: HomePageRecord;
  pathname: string;
}) => {
  const seoDescription = getHomeSeoDescription(homePage);

  return buildSeo({
    description: seoDescription,
    kind: "home",
    pathname,
    structuredData: [
      buildWebsiteStructuredData(seoDescription),
      buildPersonStructuredData(seoDescription),
      ...buildCollectionPageStructuredData({
        description: seoDescription,
        items: feedStructuredDataItems,
        pathname,
        title: "Personal Site overview feed",
      }),
    ],
    title: SITE_NAME,
  });
};

async function loadHomeMetadataSeo(pathname: string) {
  const providerCache = await createPublicProviderCache();
  const homeSource = withCachedHomeSource(
    createNotionHomeSource(loadNotionHomePage),
    providerCache,
  );

  return buildHomeMetadataSeo(await homeSource.loadHomePage(), pathname);
}

async function loadHomeData(searchParams?: FeedSearchParams) {
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
  const { filter, page } = getFeedRequest(searchParams);
  const overviewFeedItems = buildOverviewFeedIndex({
    articles,
    projects,
    thoughts,
    xPosts,
  });
  const feedPage = paginateFeed(overviewFeedItems, filter, page);
  if (feedPage.outOfRange) notFound();
  const feedStructuredDataItems = feedPage.items
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
  const seo = buildHomePageSeo({
    feedStructuredDataItems,
    homePage,
    pathname: getFeedCanonicalPath(filter, page),
  });

  return {
    feedItems: serializeOverviewFeedItems(feedPage.items),
    filter,
    pagination: feedPage.pagination,
    homePage,
    seo,
  };
}

export async function generateMetadata(
  { searchParams }: { searchParams?: HomeSearchParams },
): Promise<Metadata> {
  const { filter, page } = getFeedRequest(await searchParams);
  return seoToMetadata(await loadHomeMetadataSeo(getFeedCanonicalPath(filter, page)));
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: HomeSearchParams;
}) {
  const params = await searchParams;
  const { feedItems, filter, pagination, homePage, seo } = await loadHomeData(params);

  return (
    <>
      <StructuredDataScripts seo={seo} />
      <ProfileHero blocks={homePage.blocks} />
      <OverviewFeed initialFilter={filter} items={feedItems} pagination={pagination} />
    </>
  );
}
