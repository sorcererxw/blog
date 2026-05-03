import { getOptionalEnv } from "@/config/env";

export const NotionSecret = getOptionalEnv("NOTION_SECRET", process.env);
export const TelegramAppID = Number(getOptionalEnv("TELEGRAM_APP_ID", process.env, "0"));
export const TelegramAppSecret = getOptionalEnv("TELEGRAM_APP_SECRET", process.env);
export const TelegramBot = getOptionalEnv("TELEGRAM_BOT", process.env);
export const TelegramToken = getOptionalEnv("TELEGRAM_TOKEN", process.env);
