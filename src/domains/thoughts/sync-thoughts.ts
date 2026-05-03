import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  collectLiveTelegramThoughtRecords,
  type TelegramCredentials,
} from "../../integrations/telegram/mtcute-thoughts.ts";
import {
  normalizeTelegramThoughtRecord,
  type TelegramThoughtRecord,
} from "../../integrations/telegram/thoughts.ts";

import {
  sortThoughtsNewestFirst,
  toThoughtSnapshotItem,
} from "./snapshot.ts";
import type { ThoughtListItem } from "./types.ts";

export const THOUGHTS_SNAPSHOT_PATH = fileURLToPath(
  new URL("./thoughts.snapshot.json", import.meta.url),
);

type SnapshotFs = {
  mkdir: typeof mkdir;
  writeFile: typeof writeFile;
  rename: typeof rename;
};

export const buildThoughtSnapshot = (
  records: TelegramThoughtRecord[],
): ThoughtListItem[] =>
  sortThoughtsNewestFirst(records.map(normalizeTelegramThoughtRecord));

export const serializeThoughtSnapshot = (items: ThoughtListItem[]): string =>
  JSON.stringify(items.map(toThoughtSnapshotItem), null, 2) + "\n";

export const createLiveThoughtLoader = (
  credentials: TelegramCredentials,
  options: {
    channelUsername?: string;
    limit?: number;
  } = {},
) => {
  return async () =>
    collectLiveTelegramThoughtRecords({
      credentials,
      channelUsername: options.channelUsername,
      limit: options.limit,
    });
};

export async function syncThoughtsSnapshot({
  outputFile = THOUGHTS_SNAPSHOT_PATH,
  loadRecords,
  fs = { mkdir, writeFile, rename },
}: {
  outputFile?: string;
  loadRecords: () => Promise<TelegramThoughtRecord[]>;
  fs?: SnapshotFs;
}): Promise<ThoughtListItem[]> {
  const snapshot = buildThoughtSnapshot(await loadRecords());
  const payload = serializeThoughtSnapshot(snapshot);
  const temporaryFile = `${outputFile}.tmp`;

  await fs.mkdir(dirname(outputFile), { recursive: true });
  await fs.writeFile(temporaryFile, payload);
  await fs.rename(temporaryFile, outputFile);

  return snapshot;
}
