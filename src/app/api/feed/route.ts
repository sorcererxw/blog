import { loadOverviewFeed } from "@/app/feed-data";
import { getFeedBatch, getFeedRequest } from "@/domains/feed/feed-batch";
import { serializeOverviewFeedItems } from "@/domains/feed/overview-feed-serialization";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = Object.fromEntries(["type", "source", "after"].map((key) => {
    const values = url.searchParams.getAll(key);
    return [key, values.length > 1 ? values : values[0]];
  }));
  const { filter, after, invalidCursor } = getFeedRequest(params);
  const invalidResponse = () => Response.json({ error: "invalid_cursor" }, {
    status: 400,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
  if (invalidCursor) return invalidResponse();
  const batch = getFeedBatch(await loadOverviewFeed(), filter, after);
  if (batch.invalidCursor) return invalidResponse();
  return Response.json({
    items: serializeOverviewFeedItems(batch.items),
    nextCursor: batch.nextCursor,
  }, { headers: {
    "Cache-Control": "public, max-age=0, s-maxage=600",
    "X-Robots-Tag": "noindex",
  } });
}
