import type {
  FeedDestination,
  FeedItemType,
  FeedMediaPreview,
  FeedQuotePreview,
  FeedRichTextSegment,
  PresentationIntent,
} from "./types";

export type OverviewFeedViewItem = {
  destination: FeedDestination;
  displayedAt: string | null;
  id: string;
  media: FeedMediaPreview[];
  metaLabel?: string | null;
  presentationIntent?: PresentationIntent | null;
  quote?: FeedQuotePreview | null;
  source: string;
  sourcePublishedAt: string | null;
  summary: string;
  summaryRichText?: FeedRichTextSegment[];
  title: string;
  titleEmoji?: string | null;
  type: FeedItemType;
};
