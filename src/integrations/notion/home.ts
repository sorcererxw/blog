import { Client, collectPaginatedAPI } from "@notionhq/client";
import { cache } from "react";

import { getRuntimeConfig } from "@/config/runtime";
import { NotionSecret } from "@/config/server";

export const HOME_PAGE_ID = "ac63bdb57d224c41a951c0536396bdf4";

export type HomePageBlock = {
  id: string;
  type: string;
  has_children?: boolean;
  children: HomePageBlock[];
  [key: string]: unknown;
};

export type HomePageRecord = {
  id: string;
  blocks: HomePageBlock[];
};

export type HomePageSource = {
  loadHomePage: () => Promise<HomePageRecord>;
};

type NotionRichText = {
  plain_text?: string;
  href?: string | null;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
  };
  text?: {
    content?: string;
    link?: { url?: string | null } | null;
  };
};

const demoHomePage: HomePageRecord = {
  id: HOME_PAGE_ID,
  blocks: [
    {
      id: "demo-home-heading",
      type: "heading_1",
      children: [],
      heading_1: {
        rich_text: [
          {
            plain_text: "A focused homepage for articles, thoughts, and projects.",
          },
        ],
      },
    },
    {
      id: "demo-home-summary",
      type: "paragraph",
      children: [],
      paragraph: {
        rich_text: [
          {
            plain_text:
              "Blog2 is the new public surface for Tempura, backed by a fixed Notion page so the home route can stay simple and content-first.",
          },
        ],
      },
    },
    {
      id: "demo-home-note",
      type: "quote",
      children: [],
      quote: {
        rich_text: [
          {
            plain_text: "Build the shell first, then let the page content speak for itself.",
          },
        ],
      },
    },
  ],
};

const readPlainText = (value: unknown): string => {
  if (!Array.isArray(value)) {
    return "";
  }

  return value
    .map((part) => {
      if (typeof part !== "object" || part === null) {
        return "";
      }

      const item = part as NotionRichText;

      return item.plain_text ?? item.text?.content ?? "";
    })
    .join("")
    .trim();
};

const getRichText = (block: HomePageBlock): NotionRichText[] => {
  const value = block[block.type] as { rich_text?: unknown } | undefined;

  if (!value || !Array.isArray(value.rich_text)) {
    return [];
  }

  return value.rich_text as NotionRichText[];
};

const createBlockTree = async (
  notion: Client,
  blockId: string,
): Promise<HomePageBlock[]> => {
  const blocks = (await collectPaginatedAPI(notion.blocks.children.list, {
    block_id: blockId,
    page_size: 100,
  })) as Array<Partial<HomePageBlock>>;

  return Promise.all(
    blocks.map(async (block) => {
      const id = typeof block.id === "string" ? block.id : "";
      const type = typeof block.type === "string" ? block.type : "unsupported";
      const children = block.has_children && id
        ? await createBlockTree(notion, id)
        : [];

      return {
        ...block,
        id,
        type,
        children,
      } as HomePageBlock;
    }),
  );
};

const toDescription = (blocks: HomePageBlock[]): string => {
  const pieces: string[] = [];

  const visit = (nodes: HomePageBlock[]) => {
    for (const block of nodes) {
      switch (block.type) {
        case "heading_1":
        case "heading_2":
        case "heading_3":
        case "paragraph":
        case "quote":
        case "callout":
        case "code":
        case "bulleted_list_item":
        case "numbered_list_item":
          pieces.push(readPlainText(getRichText(block)));
          break;
        case "bookmark":
          pieces.push(
            readPlainText((block.bookmark as { caption?: unknown } | undefined)?.caption) ||
              (block.bookmark as { url?: string } | undefined)?.url ||
              "",
          );
          break;
        default:
          break;
      }

      if (block.children.length > 0) {
        visit(block.children);
      }
    }
  };

  visit(blocks);

  return pieces
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 320);
};

const fetchHomePage = async (): Promise<HomePageRecord> => {
  if (!NotionSecret) {
    return demoHomePage;
  }

  const notion = new Client({ auth: NotionSecret });

  try {
    const blocks = await createBlockTree(notion, HOME_PAGE_ID);

    return {
      id: HOME_PAGE_ID,
      blocks,
    };
  } catch (error) {
    if (!getRuntimeConfig().isProduction) {
      return demoHomePage;
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to load Notion home page.");
  }
};

export const loadNotionHomePage = cache(fetchHomePage);

export const createNotionHomeSource = (
  loadHomePage: HomePageSource["loadHomePage"] = loadNotionHomePage,
): HomePageSource => ({
  loadHomePage,
});

export const getHomeDescription = (blocks: HomePageBlock[]) =>
  toDescription(blocks);
