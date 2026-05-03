import type { ArticleIcon } from "./types";

export type ArticleDetailRichText = {
  plainText: string;
  href?: string | null;
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  underline?: boolean;
  code?: boolean;
  color?: string | null;
};

export type ArticleDetailTocNode = {
  id: string;
  title: string;
  nodes: ArticleDetailTocNode[];
};

export type ArticleDetailTableRow = {
  cells: Array<{
    header?: boolean;
    richText: ArticleDetailRichText[];
  }>;
};

export type ArticleDetailBlock =
  | {
      kind: "paragraph";
      text?: string;
      richText?: ArticleDetailRichText[];
      children?: ArticleDetailBlock[];
    }
  | {
      kind: "heading";
      level: 1 | 2 | 3;
      text?: string;
      id?: string;
      richText?: ArticleDetailRichText[];
      children?: ArticleDetailBlock[];
    }
  | {
      kind: "quote";
      text?: string;
      richText?: ArticleDetailRichText[];
      children?: ArticleDetailBlock[];
    }
  | {
      kind: "code";
      language: string | null;
      text: string;
      highlightedHtml?: string | null;
      renderHtml?: boolean;
      caption?: ArticleDetailRichText[];
    }
  | {
      kind: "list-item";
      ordered: boolean;
      text?: string;
      richText?: ArticleDetailRichText[];
      children?: ArticleDetailBlock[];
    }
  | {
      kind: "image";
      url: string;
      caption: string | null;
      captionRichText?: ArticleDetailRichText[];
      width?: number | null;
      height?: number | null;
      blurDataUrl?: string | null;
    }
  | {
      kind: "bookmark";
      url: string;
      title: string | null;
      description?: string | null;
      imageUrl?: string | null;
      caption?: string | null;
      captionRichText?: ArticleDetailRichText[];
    }
  | {
      kind: "divider";
    }
  | {
      kind: "callout";
      emoji?: string | null;
      color?: string | null;
      text?: string;
      richText?: ArticleDetailRichText[];
      children?: ArticleDetailBlock[];
    }
  | {
      kind: "todo";
      checked: boolean;
      text?: string;
      richText?: ArticleDetailRichText[];
      children?: ArticleDetailBlock[];
    }
  | {
      kind: "toggle";
      text?: string;
      richText?: ArticleDetailRichText[];
      children?: ArticleDetailBlock[];
    }
  | {
      kind: "table";
      rows: ArticleDetailTableRow[];
    }
  | {
      kind: "tableOfContent";
      nodes: ArticleDetailTocNode[];
    }
  | {
      kind: "columns";
      columns: Array<{
        id: string;
        children: ArticleDetailBlock[];
      }>;
    }
  | {
      kind: "video";
      url: string;
      caption?: string | null;
      captionRichText?: ArticleDetailRichText[];
    }
  | {
      kind: "linkPreview";
      url: string;
    };

export type ArticleDetail = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  date: Date;
  cover?: string | null;
  icon?: ArticleIcon | null;
  blocks: ArticleDetailBlock[];
};

export type NotionArticleDetailRecord = ArticleDetail & {
  wip?: boolean;
};
