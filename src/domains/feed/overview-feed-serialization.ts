import type { FeedItem } from "./types";
import type { OverviewFeedViewItem } from "./overview-feed-view-model";

export const serializeOverviewFeedItems = (items: FeedItem[]): OverviewFeedViewItem[] =>
  items.map((item) => ({
    ...item,
    displayedAt: item.displayedAt?.toISOString() ?? null,
    sourcePublishedAt: item.sourcePublishedAt?.toISOString() ?? null,
  }));
