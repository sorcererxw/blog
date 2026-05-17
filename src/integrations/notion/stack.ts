import { Client } from "@notionhq/client";
import { getPrimaryDataSourceId } from "@/integrations/notion/data-source";
import { getRuntimeInfo, getWorkerEnv } from "@/lib/cloudflare-env";
import type { NotionStackRecord, StackIcon } from "@/domains/stack/types";

export type NotionStackSource = {
  listStack: () => Promise<NotionStackRecord[]>;
};

type NotionPageProperty = {
  type?: string;
  rich_text?: unknown;
  title?: unknown;
};

export const createNotionStackSource = (
  listStack: NotionStackSource["listStack"],
): NotionStackSource => ({
  listStack,
});

const STACKS_DATABASE_ID = "b27f9ded6f7c4c2ba5d34fbc48a7decb";

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

  return readPlainText(property.rich_text ?? property.title);
};

const getMultiSelectPropertyValue = (
  properties: Record<string, unknown>,
  name: string,
): string[] => {
  const property = getProperty(properties, name);
  const multiSelect = (property as { multi_select?: Array<{ name?: string }> } | null)?.multi_select;

  if (!Array.isArray(multiSelect)) {
    return [];
  }

  return multiSelect
    .map((item) => item.name?.trim() ?? "")
    .filter((item) => item.length > 0);
};

const getStackIcon = (icon: unknown): StackIcon | null => {
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

const toStackRecord = (page: {
  id: string;
  properties?: Record<string, unknown>;
  icon?: unknown;
}): NotionStackRecord => {
  const properties = page.properties ?? {};

  return {
    id: page.id,
    name: getTitlePropertyValue(properties) || getTextPropertyValue(properties, "Name"),
    link: getTextPropertyValue(properties, "Link"),
    description: getTextPropertyValue(properties, "Summary"),
    platforms: getMultiSelectPropertyValue(properties, "Platform"),
    tags: getMultiSelectPropertyValue(properties, "Tags"),
    icon: getStackIcon(page.icon),
  };
};

const fetchNotionStacks = async (): Promise<NotionStackRecord[]> => {
  const workerEnv = await getWorkerEnv();
  const notionSecret = workerEnv.NOTION_SECRET;

  if (!notionSecret) {
    if (!getRuntimeInfo(workerEnv).isProduction) {
      return [];
    }

    throw new Error("Missing NOTION_SECRET.");
  }

  const notion = new Client({ auth: notionSecret });

  try {
    const dataSourceId = await getPrimaryDataSourceId(notion, STACKS_DATABASE_ID);
    const data = await notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: 100,
      sorts: [
        {
          property: "Name",
          direction: "ascending",
        },
      ],
    });

    return (data.results as Array<{
      id: string;
      properties?: Record<string, unknown>;
      icon?: unknown;
    }>).map(toStackRecord);
  } catch (error) {
    if (!getRuntimeInfo(workerEnv).isProduction) {
      return [];
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to query Notion stack entries.");
  }
};

export const listStacksFromNotion = async (): Promise<NotionStackRecord[]> =>
  fetchNotionStacks();
