import { Client } from "@notionhq/client";
import { getPrimaryDataSourceId } from "@/integrations/notion/data-source";
import { getRuntimeInfo, getWorkerEnv } from "@/lib/cloudflare-env";
import type {
  ArticleIcon,
  NotionArticleRecord,
} from "@/domains/article/types";

export type NotionArticleSource = {
  listArticles: (options?: { includeWip?: boolean }) => Promise<NotionArticleRecord[]>;
};

type NotionPageProperty = {
  type?: string;
  rich_text?: unknown;
  title?: unknown;
  date?: { start?: string | null } | null;
  checkbox?: boolean;
  external?: { url?: string };
  file?: { url?: string };
};

export const createNotionArticleSource = (
  listArticles: NotionArticleSource["listArticles"],
): NotionArticleSource => ({
  listArticles,
});

export const normalizeNotionArticleRecord = (
  record: NotionArticleRecord,
): NotionArticleRecord => ({
  ...record,
});

const readPlainText = (value: unknown): string => {
  if (!Array.isArray(value)) {
    return "";
  }

  return value
    .map((part) => {
      if (typeof part !== "object" || part === null) {
        return "";
      }

      const item = part as {
        plain_text?: string;
        text?: { content?: string };
        href?: string | null;
      };

      return item.plain_text ?? item.text?.content ?? "";
    })
    .join("")
    .trim();
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
): ArticleIcon | null => {
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
    type?: string;
    external?: { url?: string };
    file?: { url?: string };
  };

  return value.external?.url ?? value.file?.url ?? null;
};

const toArticleRecord = (page: {
  id: string;
  properties?: Record<string, unknown>;
  icon?: unknown;
  cover?: unknown;
}): NotionArticleRecord => {
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
    wip: getCheckboxPropertyValue(properties, "WIP"),
  };
};

const fetchNotionArticles = async ({
  includeWip,
}: {
  includeWip?: boolean;
} = {}): Promise<NotionArticleRecord[]> => {
  const workerEnv = await getWorkerEnv();
  const notionToken = workerEnv.NOTION_SECRET;
  const blogDatabaseId = workerEnv.NOTION_BLOG_DATABASE_ID;

  if (!notionToken) {
    if (!getRuntimeInfo(workerEnv).isProduction) {
      return [];
    }

    throw new Error("Missing NOTION_SECRET.");
  }

  if (!blogDatabaseId) {
    if (!getRuntimeInfo(workerEnv).isProduction) {
      return [];
    }

    throw new Error("Missing NOTION_BLOG_DATABASE_ID.");
  }

  const notion = new Client({ auth: notionToken });

  try {
    const dataSourceId = await getPrimaryDataSourceId(notion, blogDatabaseId);
    const data = await notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: 100,
      sorts: [
        {
          property: "Date",
          direction: "descending",
        },
      ],
      filter: includeWip
        ? undefined
        : {
            property: "WIP",
            checkbox: {
              does_not_equal: true,
            },
          },
    });

    return (data.results as Array<{
      id: string;
      properties?: Record<string, unknown>;
      icon?: unknown;
      cover?: unknown;
    }>).map(toArticleRecord);
  } catch (error) {
    if (!getRuntimeInfo(workerEnv).isProduction) {
      return [];
    }

    throw error;
  }
};

export const createBlogArticleSource = (): NotionArticleSource =>
  createNotionArticleSource((options?: { includeWip?: boolean }) =>
    fetchNotionArticles(options),
  );
