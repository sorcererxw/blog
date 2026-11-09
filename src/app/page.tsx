import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getFeedRequest, getFeedBatch, type FeedSearchParams } from "@/domains/feed/feed-batch";
import { serializeOverviewFeedItems } from "@/domains/feed/overview-feed-serialization";
import { OverviewFeed } from "@/components/feed/overview-feed-view";
import { ProfileHero } from "@/components/home/profile-hero";
import {
  buildCollectionPageStructuredData,
  buildPersonStructuredData,
  buildWebsiteStructuredData,
} from "@/domains/seo/build-structured-data";
import { buildSeo } from "@/domains/seo/build-seo";
import { SITE_NAME } from "@/domains/seo/site";
import {
  createPublicProviderCache,
  withCachedHomeSource,
} from "@/integrations/kv/provider-wrappers";
import {
  createNotionHomeSource,
  getHomeDescription,
  loadNotionHomePage,
  type HomePageRecord,
} from "@/integrations/notion/home";
import { seoToMetadata, StructuredDataScripts } from "./seo";
import { loadOverviewFeed } from "./feed-data";

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
  const { filter, after, invalidCursor } = getFeedRequest(searchParams);
  if (invalidCursor) notFound();
  const providerCache = await createPublicProviderCache();
  const homeSource = withCachedHomeSource(
    createNotionHomeSource(loadNotionHomePage),
    providerCache,
  );
  const [homePage, overviewFeedItems] = await Promise.all([
    homeSource.loadHomePage(),
    loadOverviewFeed(providerCache),
  ]);
  const feedBatch = getFeedBatch(overviewFeedItems, filter, after);
  if (feedBatch.invalidCursor) notFound();
  const feedStructuredDataItems = feedBatch.items
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
    pathname: "/",
  });

  return {
    feedItems: serializeOverviewFeedItems(feedBatch.items),
    filter,
    nextCursor: feedBatch.nextCursor,
    after,
    homePage,
    seo,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  return seoToMetadata(await loadHomeMetadataSeo("/"));
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: HomeSearchParams;
}) {
  const params = await searchParams;
  const { feedItems, filter, nextCursor, after, homePage, seo } = await loadHomeData(params);

  return (
    <>
      <StructuredDataScripts seo={seo} />
      <ProfileHero blocks={homePage.blocks} />
      <OverviewFeed key={JSON.stringify([filter.type, filter.source, after])} initialFilter={filter} items={feedItems} nextCursor={nextCursor} />
    </>
  );
}
