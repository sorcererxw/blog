import {
  scrapeTelegramPublicPageThoughtRecords,
} from "@/integrations/telegram/public-page";
import {
  normalizeTelegramThoughtRecord,
  type TelegramThoughtRecord,
} from "@/integrations/telegram/thoughts";

import { sortThoughtsNewestFirst } from "./snapshot";
import type { ThoughtListItem } from "./types";

export const TELEGRAM_THOUGHTS_REVALIDATE_SECONDS = 600;

export const buildThoughtList = (
  records: TelegramThoughtRecord[],
): ThoughtListItem[] =>
  sortThoughtsNewestFirst(records.map(normalizeTelegramThoughtRecord));

export async function listThoughts({
  channelUsername,
  fetchImpl,
  maxPages,
  revalidateSeconds = TELEGRAM_THOUGHTS_REVALIDATE_SECONDS,
}: {
  channelUsername?: string;
  fetchImpl?: typeof fetch;
  maxPages?: number;
  revalidateSeconds?: number;
} = {}): Promise<ThoughtListItem[]> {
  const records = await scrapeTelegramPublicPageThoughtRecords({
    channelUsername,
    fetchImpl,
    maxPages,
    revalidateSeconds,
  });

  return buildThoughtList(records);
}
