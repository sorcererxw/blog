import type { APIRoute } from "astro";

import { TELEGRAM_CHANNEL_USERNAME } from "@/integrations/telegram/thoughts";

export const prerender = false;

export const GET: APIRoute = async () =>
  new Response(
    JSON.stringify({
      ok: false,
      channel: TELEGRAM_CHANNEL_USERNAME,
      reason: "Thoughts now read a checked-in snapshot file; cron refresh is disabled.",
    }),
    {
      status: 410,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
