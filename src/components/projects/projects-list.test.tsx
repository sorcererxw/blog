import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProjectsList } from "@/components/projects/projects-list";
import type { ProjectListItem } from "@/domains/projects/types";

const masonryFeedState = vi.hoisted(() => ({
  instances: [] as Array<{
    calculateItemHeight?: (item: ProjectListItem, columns: number) => number;
    className?: string;
    items: ProjectListItem[];
  }>,
}));

vi.mock("@/components/feed/masonry-feed", () => ({
  MasonryFeed: ({
    calculateItemHeight,
    className,
    items,
    renderItem,
  }: {
    calculateItemHeight?: (item: ProjectListItem, columns: number) => number;
    className?: string;
    items: ProjectListItem[];
    renderItem: (item: ProjectListItem) => React.ReactNode;
  }) => {
    masonryFeedState.instances.push({ calculateItemHeight, className, items });

    return (
      <div data-slot="masonry-feed-mock">
        {items.map((item) => (
          <div key={item.url}>{renderItem(item)}</div>
        ))}
      </div>
    );
  },
}));

describe("ProjectsList", () => {
  const projects: ProjectListItem[] = [
    {
      title: "Newest Project",
      description: "Newest description",
      url: "https://example.com/newest",
      emoji: "✨",
    },
    {
      title: "Older Project",
      description: "Older description",
      url: "https://example.com/older",
      emoji: "🧪",
    },
  ];

  beforeEach(() => {
    masonryFeedState.instances = [];
  });

  it("passes project items through the masonry feed and renders each public entry", () => {
    const markup = renderToStaticMarkup(<ProjectsList items={projects} />);

    expect(masonryFeedState.instances).toHaveLength(1);
    expect(masonryFeedState.instances[0].items).toEqual(projects);
    expect(typeof masonryFeedState.instances[0].calculateItemHeight).toBe("function");
    expect(markup).toContain('data-slot="masonry-feed-mock"');
    expect(markup).toContain('href="https://example.com/newest"');
    expect(markup).toContain('href="https://example.com/older"');
    expect(markup).toContain("Newest Project");
    expect(markup).toContain("Older Project");
    expect(markup).toContain("Newest description");
    expect(markup).toContain("Older description");
    expect(markup).toContain("✨");
    expect(markup).toContain("🧪");
    expect(markup).toContain("Visit project ↗");
    expect(markup).not.toContain("Built things that escaped the notebook and shipped.");
    expect(markup).not.toContain(
      "A selective ledger of products, experiments, and systems with enough weight to stand on their own.",
    );
    expect(markup).toContain("project-card-title");
    expect(markup).toContain("project-card-cta");
    expect(markup).toContain("text-muted");
  });

  it("passes responsive projects into the masonry feed", () => {
    const responsiveProjects: ProjectListItem[] = [
      {
        title: "Tall Project",
        description: "x".repeat(120),
        url: "https://example.com/tall",
        emoji: "📦",
      },
      {
        title: "Short Project",
        description: "tiny",
        url: "https://example.com/short",
        emoji: "🫧",
      },
    ];

    const markup = renderToStaticMarkup(<ProjectsList items={responsiveProjects} />);

    expect(masonryFeedState.instances).toHaveLength(1);
    expect(masonryFeedState.instances[0].items).toEqual(responsiveProjects);
    expect(typeof masonryFeedState.instances[0].calculateItemHeight).toBe("function");
    expect(markup).toContain('data-slot="masonry-feed-mock"');
    expect(markup).toContain("Tall Project");
    expect(markup).toContain("Short Project");
    expect(markup).toContain('href="https://example.com/tall"');
    expect(markup).toContain('href="https://example.com/short"');
  });

  it("renders an explicit empty state when no projects exist", () => {
    const markup = renderToStaticMarkup(<ProjectsList items={[]} />);

    expect(markup).toContain('aria-label="Projects list empty state"');
    expect(markup).toContain("Projects");
    expect(markup).toContain("No projects published yet.");
    expect(markup).toContain("The public projects index is ready.");
  });
});
