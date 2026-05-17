export type ThoughtRichTextSegment = {
  plainText: string;
  url?: string | null;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  monospace?: boolean;
  quote?: boolean;
  hashTag?: boolean;
};

export type ThoughtPhoto = {
  id: number;
  thumbnailUrl?: string | null;
  originalUrl?: string | null;
  width?: number | null;
  height?: number | null;
};

export type ThoughtWebpage = {
  title: string;
  description: string;
  displayUrl: string;
  url: string;
  sitename: string;
  embedUrl: string;
  author: string;
  photo?: ThoughtPhoto | null;
};

export type ThoughtReaction = {
  emoticon: string;
  count: number;
};

export type ThoughtListItem = {
  id: string;
  date: Date;
  displayedAt?: Date | null;
  link: string;
  moduleSize?: string | null;
  richText: ThoughtRichTextSegment[];
  photos: ThoughtPhoto[];
  replyTo: string | null;
  forwardedFrom: string | null;
  webpage: ThoughtWebpage | null;
  reactions: ThoughtReaction[];
};
