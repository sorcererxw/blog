import { describe, expect, it, vi } from "vitest";

import { createMemoryStackListCache } from "@/integrations/kv/stack-cache";
import { createNotionStackSource } from "@/integrations/notion/stack";
import { listStack } from "@/domains/stack/list-stack";

describe("listStack", () => {
  it("returns stack items ordered by name and preserves the public shape", async () => {
    const source = createNotionStackSource(
      vi.fn(async () => [
        {
          id: "stack-z",
          name: "Zed Tool",
          link: "https://example.com/zed",
          description: "Zed description",
          platforms: ["Web"],
          tags: ["Editor"],
          icon: { kind: "url", value: "https://example.com/zed.png" },
        },
        {
          id: "stack-a",
          name: "Alpha Tool",
          link: "https://example.com/alpha",
          description: "Alpha description",
          platforms: ["Mobile", "Web"],
          tags: ["Productivity"],
          icon: { kind: "emoji", value: "✨" },
        },
      ]),
    );

    const items = await listStack({
      source,
      cache: createMemoryStackListCache(),
    });

    expect(items).toHaveLength(2);
    expect(items.map((item) => item.name)).toEqual([
      "Alpha Tool",
      "Zed Tool",
    ]);
    expect(items[0]).toMatchObject({
      name: "Alpha Tool",
      link: "https://example.com/alpha",
      description: "Alpha description",
      platforms: ["Mobile", "Web"],
      tags: ["Productivity"],
      icon: { kind: "emoji", value: "✨" },
    });
  });

  it("returns an explicit empty list when the source has no stack items", async () => {
    const source = createNotionStackSource(vi.fn(async () => []));

    const items = await listStack({
      source,
      cache: createMemoryStackListCache(),
    });

    expect(items).toEqual([]);
  });
});
