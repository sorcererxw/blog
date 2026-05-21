export type FeedItemType = "writing" | "projects" | "social";

export type SocialSource = "telegram" | "twitter" | string;

export type ModuleSize = "compact" | "standard" | "feature";
export type PresentationIntent = "feature";

export type FeedDestination =
  | {
      kind: "internal";
      href: string;
    }
  | {
      kind: "external";
      href: string;
    }
  | {
      kind: "none";
    };

export type FeedMediaPreview = {
  alt: string;
  height?: number | null;
  src: string;
  width?: number | null;
};

export type FeedQuotePreview = {
  authorName?: string | null;
  authorUsername?: string | null;
  media: FeedMediaPreview[];
  text: string;
  url: string;
};

export type FeedRichTextSegment = {
  bold?: boolean;
  hashTag?: boolean;
  italic?: boolean;
  monospace?: boolean;
  plainText: string;
  quote?: boolean;
  strike?: boolean;
  underline?: boolean;
  url?: string | null;
};

export type FeedItem = {
  id: string;
  type: FeedItemType;
  source: "notion" | SocialSource;
  title: string;
  summary: string;
  summaryRichText?: FeedRichTextSegment[];
  titleEmoji?: string | null;
  displayedAt: Date | null;
  sourcePublishedAt: Date | null;
  presentationIntent?: PresentationIntent | null;
  quote?: FeedQuotePreview | null;
  destination: FeedDestination;
  media: FeedMediaPreview[];
  metaLabel?: string | null;
};

export type FeedFilter = {
  source?: string | null;
  type?: FeedItemType | null;
};
