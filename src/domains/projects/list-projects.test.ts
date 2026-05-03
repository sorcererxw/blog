import { describe, expect, it, vi } from "vitest";

import { createMemoryProjectListCache } from "@/integrations/kv/projects-cache";
import { createNotionProjectSource } from "@/integrations/notion/projects";
import { listProjects } from "@/domains/projects/list-projects";

describe("listProjects", () => {
  it("returns newest projects first and preserves the public card shape", async () => {
    const source = createNotionProjectSource(
      vi.fn(async () => [
        {
          id: "project-old",
          title: "Older Project",
          description: "Older description",
          url: "https://example.com/older",
          emoji: "🧪",
          period: new Date("2025-12-01T00:00:00.000Z"),
        },
        {
          id: "project-new",
          title: "Newest Project",
          description: "Newest description",
          url: "https://example.com/newest",
          emoji: "✨",
          period: new Date("2026-02-01T00:00:00.000Z"),
        },
      ]),
    );

    const items = await listProjects({
      source,
      cache: createMemoryProjectListCache(),
    });

    expect(items).toHaveLength(2);
    expect(items.map((item) => item.title)).toEqual([
      "Newest Project",
      "Older Project",
    ]);
    expect(items[0]).toMatchObject({
      title: "Newest Project",
      description: "Newest description",
      url: "https://example.com/newest",
      emoji: "✨",
    });
  });

  it("returns an explicit empty list when the source has no projects", async () => {
    const source = createNotionProjectSource(vi.fn(async () => []));

    const items = await listProjects({
      source,
      cache: createMemoryProjectListCache(),
    });

    expect(items).toEqual([]);
  });
});
