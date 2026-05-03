import process from "node:process";

import {
  THOUGHTS_SNAPSHOT_PATH,
  createLiveThoughtLoader,
  syncThoughtsSnapshot,
} from "../src/domains/thoughts/sync-thoughts.ts";
import { scrapeTelegramPublicPageThoughtRecords } from "../src/integrations/telegram/public-page.ts";

const apiId = Number(process.env.TELEGRAM_APP_ID ?? "");
const apiHash = process.env.TELEGRAM_APP_SECRET ?? "";
const botToken = process.env.TELEGRAM_TOKEN ?? "";

if (!Number.isFinite(apiId) || apiId <= 0 || !apiHash || !botToken) {
  console.error(
    "Missing Telegram sync credentials. Set TELEGRAM_APP_ID, TELEGRAM_APP_SECRET, and TELEGRAM_TOKEN before running sync:thoughts.",
  );
  process.exit(1);
}

const items = await syncThoughtsSnapshot({
  outputFile: THOUGHTS_SNAPSHOT_PATH,
  loadRecords: async () => {
    try {
      return await createLiveThoughtLoader({
        apiId,
        apiHash,
        botToken,
      })();
    } catch (error) {
      const message = String(error instanceof Error ? error.message : error);
      if (message.includes("BOT_METHOD_INVALID")) {
        console.warn(
          "MTProto bot history read failed with BOT_METHOD_INVALID, falling back to Telegram public page scraping.",
        );
        return scrapeTelegramPublicPageThoughtRecords({
          channelUsername: "tech_bb",
        });
      }

      throw error;
    }
  },
});

console.log(
  `Wrote ${items.length} thoughts to ${THOUGHTS_SNAPSHOT_PATH}`,
);
