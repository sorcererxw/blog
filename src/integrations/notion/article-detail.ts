import { Client, collectPaginatedAPI } from "@notionhq/client";
import { highlightCode } from "@/domains/article/highlight-code";
import { getPrimaryDataSourceId } from "@/integrations/notion/data-source";
import { getRuntimeInfo, getWorkerEnv } from "@/lib/cloudflare-env";
import type {
  ArticleDetailBlock,
  ArticleDetailRichText,
  ArticleDetailTocNode,
  NotionArticleDetailRecord,
} from "@/domains/article/article-detail-types";

type NotionPageProperty = {
  type?: string;
  rich_text?: unknown;
  title?: unknown;
  date?: { start?: string | null } | null;
  checkbox?: boolean;
  url?: string;
  caption?: unknown;
  language?: string;
  expression?: string;
};

type NotionBlock = {
  id: string;
  type?: string;
  has_children?: boolean;
  children?: NotionBlock[];
  [key: string]: unknown;
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
    color?: string;
  };
  text?: {
    content?: string;
    link?: { url?: string | null } | null;
  };
};

export type NotionArticleDetailSource = {
  getArticleBySlug: (options: {
    slug: string;
    includeWip?: boolean;
  }) => Promise<NotionArticleDetailRecord | null>;
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

const normalizeRichText = (value: unknown): ArticleDetailRichText[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((part) => {
    if (typeof part !== "object" || part === null) {
      return [];
    }

    const item = part as NotionRichText;
    const plainText = item.plain_text ?? item.text?.content ?? "";

    if (!plainText) {
      return [];
    }

    return [
      {
        plainText,
        href: item.href ?? item.text?.link?.url ?? null,
        bold: item.annotations?.bold ?? false,
        italic: item.annotations?.italic ?? false,
        strikethrough: item.annotations?.strikethrough ?? false,
        underline: item.annotations?.underline ?? false,
        code: item.annotations?.code ?? false,
        color: item.annotations?.color ?? null,
      },
    ];
  });
};

const getProperty = (
  properties: Record<string, unknown>,
  name: string,
): NotionPageProperty | null => {
  const entry = properties[name] ?? properties[name.toLowerCase()];

  if (typeof entry !== "object" || entry === null) {
    return null;
  }

  return entry as NotionPageProperty;
};

const getTitlePropertyValue = (properties: Record<string, unknown>): string => {
  for (const [name, value] of Object.entries(properties)) {
    if (typeof value !== "object" || value === null) {
      continue;
    }

    const property = value as NotionPageProperty;

    if (property.type === "title" || name.toLowerCase() === "title") {
      return readPlainText(property.title ?? property.rich_text);
    }
  }

  return "";
};

const getTextPropertyValue = (
  properties: Record<string, unknown>,
  name: string,
): string => {
  const property = getProperty(properties, name);

  if (!property) {
    return "";
  }

  return readPlainText(property.rich_text ?? property.title);
};

const getDatePropertyValue = (
  properties: Record<string, unknown>,
  name: string,
  fallback: Date,
): Date => {
  const property = getProperty(properties, name);
  const start = property?.date?.start ?? null;

  return start ? new Date(start) : fallback;
};

const getCheckboxPropertyValue = (
  properties: Record<string, unknown>,
  name: string,
): boolean => {
  const property = getProperty(properties, name);

  return property?.checkbox === true;
};

const getArticleIcon = (
  icon: unknown,
): NotionArticleDetailRecord["icon"] => {
  if (typeof icon !== "object" || icon === null) {
    return null;
  }

  const value = icon as {
    type?: string;
    emoji?: string;
    external?: { url?: string };
    file?: { url?: string };
  };

  if (value.type === "emoji" && value.emoji) {
    return { kind: "emoji", value: value.emoji };
  }

  const url = value.external?.url ?? value.file?.url;
  if (url) {
    return { kind: "url", value: url };
  }

  return null;
};

const getArticleCover = (cover: unknown): string | null => {
  if (typeof cover !== "object" || cover === null) {
    return null;
  }

  const value = cover as {
    external?: { url?: string };
    file?: { url?: string };
  };

  return value.external?.url ?? value.file?.url ?? null;
};

const getBlockCaption = (caption: unknown): string | null => {
  if (!Array.isArray(caption)) {
    return null;
  }

  const text = readPlainText(caption);

  return text || null;
};

const toBlockText = (block: NotionBlock): string => {
  const richText = block[block.type ?? ""] as { rich_text?: unknown } | undefined;
  return readPlainText(richText?.rich_text);
};

const toBlockRichText = (block: NotionBlock): ArticleDetailRichText[] => {
  const richText = block[block.type ?? ""] as { rich_text?: unknown } | undefined;
  return normalizeRichText(richText?.rich_text);
};

const toTocNodes = (blocks: NotionBlock[]): ArticleDetailTocNode[] =>
  blocks.flatMap((block) => {
    if (block.type !== "heading_1" && block.type !== "heading_2" && block.type !== "heading_3") {
      return [];
    }

    const richText = toBlockRichText(block);
    const title = richText.map((item) => item.plainText).join("").trim();

    if (!title) {
      return [];
    }

    return [
      {
        id: block.id,
        title,
        nodes: toTocNodes(block.children ?? []),
      },
    ];
  });

const createBlockTree = async (
  notion: Client,
  blockId: string,
): Promise<NotionBlock[]> => {
  const blocks = (await collectPaginatedAPI(notion.blocks.children.list, {
    block_id: blockId,
    page_size: 100,
  })) as NotionBlock[];

  return Promise.all(
    blocks.map(async (block) => ({
      ...block,
      children:
        block.has_children && block.id
          ? await createBlockTree(notion, block.id)
          : [],
    })),
  );
};

const toArticleDetailBlocks = (blocks: NotionBlock[]): ArticleDetailBlock[] => {
  const result: ArticleDetailBlock[] = [];

  for (const block of blocks) {
    const children = toArticleDetailBlocks(block.children ?? []);
    const richText = toBlockRichText(block);
    const text = richText.length > 0 ? richText.map((item) => item.plainText).join("") : toBlockText(block);

    switch (block.type) {
      case "paragraph":
        result.push({ kind: "paragraph", text, richText, children });
        break;
      case "heading_1":
        result.push({ kind: "heading", level: 1, id: block.id, text, richText, children });
        break;
      case "heading_2":
        result.push({ kind: "heading", level: 2, id: block.id, text, richText, children });
        break;
      case "heading_3":
        result.push({ kind: "heading", level: 3, id: block.id, text, richText, children });
        break;
      case "quote":
        result.push({ kind: "quote", text, richText, children });
        break;
      case "code": {
        const value = block.code as
          | (NotionPageProperty & {
              rich_text?: unknown;
              caption?: unknown;
            })
          | undefined;
        const codeText = richText.map((item) => item.plainText).join("") || text;
        result.push({
          kind: "code",
          language: value?.language ?? null,
          text: codeText,
          caption: normalizeRichText(value?.caption),
        });
        break;
      }
      case "bulleted_list_item":
        result.push({
          kind: "list-item",
          ordered: false,
          text,
          richText,
          children,
        });
        break;
      case "numbered_list_item":
        result.push({
          kind: "list-item",
          ordered: true,
          text,
          richText,
          children,
        });
        break;
      case "divider":
        result.push({ kind: "divider" });
        break;
      case "image": {
        const value = block.image as {
          external?: { url?: string };
          file?: { url?: string };
          caption?: unknown;
        };
        const url = value.external?.url ?? value.file?.url;

        if (!url) {
          break;
        }

        result.push({
          kind: "image",
          url,
          caption: getBlockCaption(value.caption),
          captionRichText: normalizeRichText(value.caption),
        });
        break;
      }
      case "bookmark": {
        const value = block.bookmark as {
          url?: string;
          caption?: unknown;
          title?: string;
          description?: string;
          image?: {
            external?: { url?: string };
            file?: { url?: string };
          };
        };

        if (!value.url) {
          break;
        }

        result.push({
          kind: "bookmark",
          url: value.url,
          title: value.title ?? getBlockCaption(value.caption),
          description: value.description ?? null,
          imageUrl: value.image?.external?.url ?? value.image?.file?.url ?? null,
          caption: getBlockCaption(value.caption),
          captionRichText: normalizeRichText(value.caption),
        });
        break;
      }
      case "callout": {
        const value = block.callout as {
          icon?: { type?: string; emoji?: string } | null;
          color?: string;
        } | undefined;

        result.push({
          kind: "callout",
          emoji: value?.icon?.type === "emoji" ? value.icon.emoji ?? null : null,
          color: value?.color ?? null,
          text,
          richText,
          children,
        });
        break;
      }
      case "to_do": {
        const value = block.to_do as { checked?: boolean } | undefined;
        result.push({
          kind: "todo",
          checked: value?.checked === true,
          text,
          richText,
          children,
        });
        break;
      }
      case "toggle":
        result.push({
          kind: "toggle",
          text,
          richText,
          children,
        });
        break;
      case "column_list":
        result.push({
          kind: "columns",
          columns: (block.children ?? []).map((column) => ({
            id: column.id,
            children: toArticleDetailBlocks(column.children ?? []),
          })),
        });
        break;
      case "table": {
        const value = block.table as {
          table_width?: number;
          has_column_header?: boolean;
          has_row_header?: boolean;
          children?: NotionBlock[];
          rows?: Array<{
            cells?: Array<{
              rich_text?: unknown;
            }>;
          }>;
        } | undefined;

        const normalizedRows = value?.rows
          ? value.rows.map((row, rowIndex) => ({
              cells: (row.cells ?? []).map((cell, cellIndex) => ({
                header:
                  (value.has_column_header === true && rowIndex === 0) ||
                  (value.has_row_header === true && cellIndex === 0),
                richText: normalizeRichText(cell.rich_text),
              })),
            }))
          : (block.children ?? []).map((row, rowIndex) => {
              const tableRow = row.table_row as {
                cells?: unknown[];
              } | undefined;

              return {
                cells: (tableRow?.cells ?? []).map((cell, cellIndex) => ({
                  header:
                    (value?.has_column_header === true && rowIndex === 0) ||
                    (value?.has_row_header === true && cellIndex === 0),
                  richText: normalizeRichText(cell),
                })),
              };
            });

        result.push({
          kind: "table",
          rows: normalizedRows,
        });
        break;
      }
      case "video": {
        const value = block.video as {
          external?: { url?: string };
          file?: { url?: string };
          caption?: unknown;
        } | undefined;
        const url = value?.external?.url ?? value?.file?.url;
        const caption = value?.caption;

        if (!url) {
          break;
        }

        result.push({
          kind: "video",
          url,
          caption: getBlockCaption(caption),
          captionRichText: normalizeRichText(caption),
        });
        break;
      }
      case "link_preview": {
        const value = block.link_preview as { url?: string } | undefined;

        if (!value?.url) {
          break;
        }

        result.push({
          kind: "linkPreview",
          url: value.url,
        });
        break;
      }
      case "table_of_contents":
        result.push({
          kind: "tableOfContent",
          nodes: toTocNodes(blocks),
        });
        break;
      default:
        break;
    }
  }

  return result;
};

const hydrateHighlightedCodeBlocks = async (
  blocks: ArticleDetailBlock[],
): Promise<ArticleDetailBlock[]> =>
  Promise.all(
    blocks.map(async (block) => {
      switch (block.kind) {
        case "paragraph":
        case "heading":
        case "quote":
        case "list-item":
        case "callout":
        case "todo":
        case "toggle":
          return {
            ...block,
            children: await hydrateHighlightedCodeBlocks(block.children ?? []),
          };
        case "columns":
          return {
            ...block,
            columns: await Promise.all(
              block.columns.map(async (column) => ({
                ...column,
                children: await hydrateHighlightedCodeBlocks(column.children),
              })),
            ),
          };
        case "code":
          if (block.renderHtml) {
            return block;
          }

          return {
            ...block,
            highlightedHtml: await highlightCode(block.text, block.language),
          };
        default:
          return block;
      }
    }),
  );

const withHighlightedCode = async (
  article: NotionArticleDetailRecord,
): Promise<NotionArticleDetailRecord> => ({
  ...article,
  blocks: await hydrateHighlightedCodeBlocks(article.blocks),
});

const toArticleDetailRecord = (
  page: {
    id: string;
    properties?: Record<string, unknown>;
    icon?: unknown;
    cover?: unknown;
  },
  blocks: NotionBlock[],
): NotionArticleDetailRecord => {
  const properties = page.properties ?? {};
  const fallbackDate = new Date(0);

  return {
    id: page.id,
    slug: getTextPropertyValue(properties, "Slug"),
    title: getTitlePropertyValue(properties) || getTextPropertyValue(properties, "Name"),
    summary: getTextPropertyValue(properties, "Summary"),
    date: getDatePropertyValue(properties, "Date", fallbackDate),
    cover: getArticleCover(page.cover),
    icon: getArticleIcon(page.icon),
    blocks: toArticleDetailBlocks(blocks),
    wip: getCheckboxPropertyValue(properties, "WIP"),
  };
};

const fetchNotionArticleBySlug = async ({
  slug,
  includeWip,
}: {
  slug: string;
  includeWip?: boolean;
}): Promise<NotionArticleDetailRecord | null> => {
  const workerEnv = await getWorkerEnv();
  const notionSecret = workerEnv.NOTION_SECRET;
  const blogDatabaseId = workerEnv.NOTION_BLOG_DATABASE_ID;

  if (!notionSecret) {
    if (!getRuntimeInfo(workerEnv).isProduction) {
      return null;
    }

    throw new Error("Missing NOTION_SECRET.");
  }

  if (!blogDatabaseId) {
    if (!getRuntimeInfo(workerEnv).isProduction) {
      return null;
    }

    throw new Error("Missing NOTION_BLOG_DATABASE_ID.");
  }

  const notion = new Client({ auth: notionSecret });

  try {
    const dataSourceId = await getPrimaryDataSourceId(notion, blogDatabaseId);
    const data = await notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: 1,
      filter: {
        and: [
          {
            property: "Slug",
            rich_text: {
              equals: slug,
            },
          },
          ...(includeWip
            ? []
            : [
                {
                  property: "WIP",
                  checkbox: {
                    does_not_equal: true,
                  },
                },
              ]),
        ],
      },
    });

    const page = data.results?.[0] as
      | {
          id: string;
          properties?: Record<string, unknown>;
          icon?: unknown;
          cover?: unknown;
        }
      | undefined;

    if (!page) {
      return null;
    }

    const blocks = await createBlockTree(notion, page.id);

    return withHighlightedCode(toArticleDetailRecord(page, blocks));
  } catch (error) {
    if (!getRuntimeInfo(workerEnv).isProduction) {
      return null;
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to query Notion article detail.");
  }
};

export const createNotionArticleDetailSource = (
  getArticleBySlug = fetchNotionArticleBySlug,
): NotionArticleDetailSource => ({
  getArticleBySlug,
});
