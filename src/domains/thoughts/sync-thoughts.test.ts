import { describe, expect, it } from "vitest";

describe("syncThoughtsSnapshot", () => {
  it("writes the processed snapshot via a temp file and rename", async () => {
    const writes: Array<{ path: string; value: string }> = [];
    const renames: Array<{ from: string; to: string }> = [];

    const { syncThoughtsSnapshot } = await import("./sync-thoughts");

    await syncThoughtsSnapshot({
      outputFile: "/tmp/thoughts.snapshot.json",
      loadRecords: async () => [
        {
          id: 2,
          date: new Date("2026-03-29T12:00:00.000Z"),
          link: "https://t.me/s/tech_bb/2",
          richText: [{ plainText: "newest" }],
          photos: [],
          replyTo: null,
          forwardedFrom: null,
          webpage: null,
          reactions: [],
        },
      ],
      fs: {
        async mkdir() {},
        async writeFile(path, value) {
          writes.push({ path, value });
        },
        async rename(from, to) {
          renames.push({ from, to });
        },
      },
    });

    expect(writes).toHaveLength(1);
    expect(writes[0]?.path).toContain(".tmp");
    expect(writes[0]?.value).toContain("\"id\": \"2\"");
    expect(renames).toEqual([
      {
        from: "/tmp/thoughts.snapshot.json.tmp",
        to: "/tmp/thoughts.snapshot.json",
      },
    ]);
  });

  it("does not clobber the old snapshot when the write step fails", async () => {
    const writes: string[] = [];
    const renames: string[] = [];

    const { syncThoughtsSnapshot } = await import("./sync-thoughts");

    await expect(
      syncThoughtsSnapshot({
        outputFile: "/tmp/thoughts.snapshot.json",
        loadRecords: async () => [
          {
            id: 2,
            date: new Date("2026-03-29T12:00:00.000Z"),
            link: "https://t.me/s/tech_bb/2",
            richText: [{ plainText: "newest" }],
            photos: [],
            replyTo: null,
            forwardedFrom: null,
            webpage: null,
            reactions: [],
          },
        ],
        fs: {
          async mkdir() {},
          async writeFile(path) {
            writes.push(path);
            throw new Error("disk full");
          },
          async rename(from) {
            renames.push(from);
          },
        },
      }),
    ).rejects.toThrow("disk full");

    expect(writes).toEqual(["/tmp/thoughts.snapshot.json.tmp"]);
    expect(renames).toEqual([]);
  });
});
