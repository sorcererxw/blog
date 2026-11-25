import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";

import { OverviewFeed } from "@/components/feed/overview-feed-view";
import {
  hasHomeTableBlock,
  type RichContentTableComponents,
} from "@/components/home/intro-content";
import { ProfileHero } from "@/components/home/profile-hero";
import { parseFeedFilter } from "@/domains/feed/overview-feed";
import { AGENT_DISCOVERY_LINK_HEADER } from "@/domains/seo/agent-discovery";
import { seoToHead, StructuredDataScripts } from "@/lib/seo-head";
import { loadHomePageData } from "@/server-handlers/home-data";

const fetchHomePageData = createServerFn({
  method: "GET",
  strict: false,
}).handler(async () => loadHomePageData());

type HomeSearch = {
  source?: string;
  type?: string;
};

export const Route = createFileRoute("/")({
  component: HomePage,
  head: ({ loaderData }) => (loaderData ? seoToHead(loaderData.seo) : {}),
  headers: () => ({
    "Cache-Control": "public, max-age=0, s-maxage=600",
    Link: AGENT_DISCOVERY_LINK_HEADER,
  }),
  loader: () => fetchHomePageData(),
  validateSearch: (search: Record<string, unknown>): HomeSearch => ({
    source: typeof search.source === "string" ? search.source : undefined,
    type: typeof search.type === "string" ? search.type : undefined,
  }),
});

function HomePage() {
  const { feedItems, homePage, seo } = Route.useLoaderData();
  const search = Route.useSearch();
  const hasTable = useMemo(
    () => hasHomeTableBlock(homePage.blocks),
    [homePage.blocks],
  );
  const [tableComponents, setTableComponents] = useState<
    RichContentTableComponents | undefined
  >(undefined);

  useEffect(() => {
    if (!hasTable) {
      return;
    }

    let cancelled = false;
    void import("@/components/rich-content/rich-content-table").then((mod) => {
      if (!cancelled) {
        setTableComponents(mod);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [hasTable]);

  const initialFilter = useMemo(() => {
    const url = new URL("https://sorcererxw.com/");
    if (search.type) {
      url.searchParams.set("type", search.type);
    }
    if (search.source) {
      url.searchParams.set("source", search.source);
    }
    return parseFeedFilter(url);
  }, [search.source, search.type]);

  return (
    <>
      <StructuredDataScripts seo={seo} />
      <ProfileHero blocks={homePage.blocks} tableComponents={tableComponents} />
      <OverviewFeed initialFilter={initialFilter} items={feedItems} />
    </>
  );
}
