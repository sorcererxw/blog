import { Client, collectPaginatedAPI } from "@notionhq/client";
import { cache } from "react";

import { getRuntimeInfo, getWorkerEnv } from "@/lib/cloudflare-env";

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
  const workerEnv = await getWorkerEnv();
  const notionSecret = workerEnv.NOTION_SECRET;
  const introPageId = workerEnv.NOTION_INTRO_PAGE_ID;

  if (!notionSecret) {
    if (!getRuntimeInfo(workerEnv).isProduction) {
      return { id: introPageId ?? "", blocks: [] };
    }

    throw new Error("Missing NOTION_SECRET.");
  }

  if (!introPageId) {
    if (!getRuntimeInfo(workerEnv).isProduction) {
      return { id: "", blocks: [] };
    }

    throw new Error("Missing NOTION_INTRO_PAGE_ID.");
  }

  const notion = new Client({ auth: notionSecret });

  try {
    const blocks = await createBlockTree(notion, introPageId);

    return {
      id: introPageId,
      blocks,
    };
  } catch (error) {
    if (!getRuntimeInfo(workerEnv).isProduction) {
      return { id: introPageId, blocks: [] };
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
