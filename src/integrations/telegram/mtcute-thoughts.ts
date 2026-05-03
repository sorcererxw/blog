import { TelegramClient } from "@mtcute/node";
import { MemoryStorage } from "@mtcute/core";

import {
  buildTelegramThoughtRecord,
  TELEGRAM_CHANNEL_USERNAME,
  type TelegramThoughtRecord,
} from "./thoughts.ts";

export type TelegramMtcuteHistoryClient = {
  iterHistory: (
    chatId: string,
    params?: {
      limit?: number;
      chunkSize?: number;
    },
  ) => AsyncIterableIterator<unknown>;
};

export type TelegramCredentials = {
  apiId: number;
  apiHash: string;
  botToken: string;
};

export const TELEGRAM_THOUGHTS_LIMIT = 24;

export const createTelegramMtcuteClient = async ({
  apiId,
  apiHash,
}: Pick<TelegramCredentials, "apiId" | "apiHash">): Promise<TelegramClient> =>
  new TelegramClient({
    apiId,
    apiHash,
    storage: new MemoryStorage(),
    disableUpdates: true,
  });

export async function collectTelegramThoughtRecords(
  client: TelegramMtcuteHistoryClient,
  channelUsername = TELEGRAM_CHANNEL_USERNAME,
  limit = TELEGRAM_THOUGHTS_LIMIT,
): Promise<TelegramThoughtRecord[]> {
  const records: TelegramThoughtRecord[] = [];

  for await (const message of client.iterHistory(channelUsername, { limit })) {
    const record = buildTelegramThoughtRecord(message as never);
    if (record) {
      records.push(record);
    }
  }

  return records.sort((left, right) => right.date.getTime() - left.date.getTime());
}

export async function collectLiveTelegramThoughtRecords({
  credentials,
  client,
  channelUsername = TELEGRAM_CHANNEL_USERNAME,
  limit = TELEGRAM_THOUGHTS_LIMIT,
}: {
  credentials: TelegramCredentials;
  client?: TelegramClient;
  channelUsername?: string;
  limit?: number;
}): Promise<TelegramThoughtRecord[]> {
  const liveClient =
    client ??
    (await createTelegramMtcuteClient({
      apiId: credentials.apiId,
      apiHash: credentials.apiHash,
    }));

  await liveClient.start({ botToken: credentials.botToken });

  try {
    return await collectTelegramThoughtRecords(liveClient, channelUsername, limit);
  } finally {
    await liveClient.destroy();
  }
}
