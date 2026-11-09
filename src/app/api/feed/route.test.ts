import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FeedItem } from "@/domains/feed/types";

vi.mock("@/app/feed-data", () => ({ loadOverviewFeed: vi.fn() }));
import { loadOverviewFeed } from "@/app/feed-data";
import { GET } from "./route";

const items: FeedItem[] = Array.from({ length: 59 }, (_, index) => ({
  id: String(index), type: index % 2 ? "writing" : "social",
  source: index % 2 ? "notion" : "telegram", title: `Item ${index}`, summary: "",
  displayedAt: new Date("2026-05-01T00:00:00Z"), sourcePublishedAt: null,
  destination: { kind: "internal", href: `/articles/${index}` }, media: [],
}));
beforeEach(() => { vi.clearAllMocks(); vi.mocked(loadOverviewFeed).mockResolvedValue(items); });

describe("GET /api/feed", () => {
  it("returns only a serialized first batch with an ID cursor and public cache policy", async () => {
    const response = await GET(new Request("https://sorcererxw.com/api/feed"));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=600");
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
    expect(data.items).toHaveLength(24);
    expect(data.items[0].displayedAt).toBe("2026-05-01T00:00:00.000Z");
    expect(data.nextCursor).toBe("23");
    expect(JSON.stringify(data)).not.toContain('"id":"24"');
  });
  it("preserves filter-before-cursor behavior and terminates the final batch", async () => {
    const response = await GET(new Request("https://sorcererxw.com/api/feed?source=telegram&after=46"));
    const data = await response.json();
    expect(data.items.map((item: { id: string }) => item.id)).toEqual(["48", "50", "52", "54", "56", "58"]);
    expect(data.nextCursor).toBeNull();
    const end = await GET(new Request("https://sorcererxw.com/api/feed?after=58"));
    expect(await end.json()).toEqual({ items: [], nextCursor: null });
  });
  it("rejects repeated cursor parameters before contacting providers", async () => {
    const response = await GET(new Request("https://sorcererxw.com/api/feed?after=1&after=2"));
    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(loadOverviewFeed).not.toHaveBeenCalled();
  });
  it("rejects stale cursors and leaves a valid empty filter as an empty success", async () => {
    const stale = await GET(new Request("https://sorcererxw.com/api/feed?after=missing"));
    expect(stale.status).toBe(400);
    const empty = await GET(new Request("https://sorcererxw.com/api/feed?source=missing"));
    expect(empty.status).toBe(200);
    expect(await empty.json()).toEqual({ items: [], nextCursor: null });
  });
});
