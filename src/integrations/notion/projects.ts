import { Client } from "@notionhq/client";
import { getPrimaryDataSourceId } from "@/integrations/notion/data-source";
import { getRuntimeInfo, getWorkerEnv } from "@/lib/cloudflare-env";
import type {
  NotionProjectRecord,
  ProjectListItem,
} from "@/domains/projects/types";

export type NotionProjectSource = {
  listProjects: () => Promise<NotionProjectRecord[]>;
};

type NotionPageProperty = {
  type?: string;
  rich_text?: unknown;
  title?: unknown;
  url?: string | null;
  date?: { start?: string | null } | null;
};

export const createNotionProjectSource = (
  listProjects: NotionProjectSource["listProjects"],
): NotionProjectSource => ({
  listProjects,
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

  if (property.type === "url") {
    return property.url ?? "";
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

const getProjectEmoji = (icon: unknown): string | null => {
  if (typeof icon !== "object" || icon === null) {
    return null;
  }

  const value = icon as {
    type?: string;
    emoji?: string;
  };

  return value.type === "emoji" && value.emoji ? value.emoji : null;
};

const toProjectRecord = (page: {
  id: string;
  url?: string;
  properties?: Record<string, unknown>;
  icon?: unknown;
}): NotionProjectRecord => {
  const properties = page.properties ?? {};
  const fallbackDate = new Date(0);
  const externalUrl = getTextPropertyValue(properties, "Link");

  return {
    id: page.id,
    title: getTitlePropertyValue(properties) || getTextPropertyValue(properties, "Name"),
    description: getTextPropertyValue(properties, "Description"),
    url: externalUrl || page.url || "",
    emoji: getProjectEmoji(page.icon),
    period: getDatePropertyValue(properties, "Period", fallbackDate),
  };
};

export const normalizeNotionProjectRecord = (
  record: NotionProjectRecord,
): ProjectListItem => ({
  title: record.title,
  description: record.description,
  url: record.url,
  emoji: record.emoji,
  period: record.period,
});

const fetchNotionProjects = async (): Promise<NotionProjectRecord[]> => {
  const workerEnv = await getWorkerEnv();
  const notionSecret = workerEnv.NOTION_SECRET;
  const projectsDatabaseId = workerEnv.NOTION_PROJECTS_DATABASE_ID;

  if (!notionSecret) {
    if (!getRuntimeInfo(workerEnv).isProduction) {
      return [];
    }

    throw new Error("Missing NOTION_SECRET.");
  }

  if (!projectsDatabaseId) {
    if (!getRuntimeInfo(workerEnv).isProduction) {
      return [];
    }

    throw new Error("Missing NOTION_PROJECTS_DATABASE_ID.");
  }

  const notion = new Client({ auth: notionSecret });

  try {
    const dataSourceId = await getPrimaryDataSourceId(notion, projectsDatabaseId);
    const data = await notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: 100,
      sorts: [
        {
          property: "Period",
          direction: "descending",
        },
      ],
    });

    return (data.results as Array<{
      id: string;
      url?: string;
      properties?: Record<string, unknown>;
      icon?: unknown;
    }>).map(toProjectRecord);
  } catch (error) {
    if (!getRuntimeInfo(workerEnv).isProduction) {
      return [];
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to query Notion projects.");
  }
};

export const listProjectsFromNotion = async (): Promise<NotionProjectRecord[]> =>
  fetchNotionProjects();
