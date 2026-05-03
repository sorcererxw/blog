import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const selectState = vi.hoisted(() => ({
  instances: [] as Array<{
    onValueChange?: (value: string | null) => void;
    value?: string | null;
  }>,
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    onValueChange,
    value,
  }: {
    children: React.ReactNode;
    onValueChange?: (value: string | null) => void;
    value?: string | null;
  }) => {
    selectState.instances.push({ onValueChange, value });

    return <div data-slot="select">{children}</div>;
  },
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div data-slot="select-content">{children}</div>
  ),
  SelectItem: ({ children }: { children: React.ReactNode }) => (
    <div data-slot="select-item">{children}</div>
  ),
  SelectTrigger: ({
    children,
    ...props
  }: React.ComponentPropsWithoutRef<"button">) => (
    <button {...props}>{children}</button>
  ),
  SelectValue: ({ placeholder }: { placeholder?: React.ReactNode }) => (
    <span>{placeholder}</span>
  ),
}));

import { StackList, StackListView } from "@/domains/stack/stack-list";
import type { StackListItem } from "@/domains/stack/types";

describe("StackList", () => {
  const stacks: StackListItem[] = [
    {
      name: "Cloudflare Workers",
      description: "Edge runtime for the rebuild.",
      link: "https://workers.cloudflare.com/",
      platforms: ["Web", "Edge"],
      tags: ["Runtime", "Deployment"],
      icon: { kind: "emoji", value: "☁" },
    },
    {
      name: "Notion",
      description: "Source of truth for content.",
      link: "https://www.notion.so/",
      platforms: ["Web"],
      tags: ["Content"],
    },
  ];

  beforeEach(() => {
    selectState.instances = [];
  });

  it("renders stack content and metadata labels", () => {
    const markup = renderToStaticMarkup(<StackList items={stacks} />);

    expect(markup).toContain("Engineering stack");
    expect(markup).toContain("The tools, runtimes, and services behind how the site ships.");
    expect(markup).toContain('href="https://workers.cloudflare.com/"');
    expect(markup).toContain('href="https://www.notion.so/"');
    expect(markup).toContain("Cloudflare Workers");
    expect(markup).toContain("Edge runtime for the rebuild.");
    expect(markup).toContain("☁");
    expect(markup).toContain("Platforms");
    expect(markup).toContain("Web");
    expect(markup).toContain("Tags");
    expect(markup).toContain("Deployment");
    expect(markup).toContain("Notion");
    expect(markup).toContain("Source of truth for content.");
  });

  it("exposes empty select state as null", () => {
    renderToStaticMarkup(<StackList items={stacks} />);

    expect(selectState.instances).toHaveLength(2);
    expect(selectState.instances.map((instance) => instance.value)).toEqual([null, null]);
  });

  it("maps null resets and concrete option values through the domain callbacks", () => {
    const onPlatformChange = vi.fn();
    const onCategoryChange = vi.fn();

    renderToStaticMarkup(
      <StackListView
        category=""
        className={undefined}
        items={stacks}
        onCategoryChange={onCategoryChange}
        onClearFilters={() => undefined}
        onPlatformChange={onPlatformChange}
        platform=""
      />,
    );

    expect(selectState.instances).toHaveLength(2);

    selectState.instances[0].onValueChange?.(null);
    expect(onPlatformChange).toHaveBeenLastCalledWith("");

    selectState.instances[0].onValueChange?.("Web");
    expect(onPlatformChange).toHaveBeenLastCalledWith("Web");

    selectState.instances[1].onValueChange?.(null);
    expect(onCategoryChange).toHaveBeenLastCalledWith("");

    selectState.instances[1].onValueChange?.("Content");
    expect(onCategoryChange).toHaveBeenLastCalledWith("Content");
  });

  it("renders an explicit empty state without the stack grid", () => {
    const markup = renderToStaticMarkup(<StackList items={[]} />);

    expect(markup).toContain("Engineering stack");
    expect(markup).toContain("No stack entries published yet.");
    expect(markup).not.toContain("Cloudflare Workers");
    expect(markup).not.toContain("Notion");
  });

  it("renders a clearable empty state when filters match nothing", () => {
    const markup = renderToStaticMarkup(
      <StackListView
        category="Database"
        className={undefined}
        items={stacks}
        onCategoryChange={() => undefined}
        onClearFilters={() => undefined}
        onPlatformChange={() => undefined}
        platform="iOS"
      />,
    );

    expect(markup).toContain("No matching entries for the selected filters.");
    expect(markup).toContain("Clear filters");
    expect(markup).not.toContain("No stack entries published yet.");
    expect(markup).not.toContain("Cloudflare Workers");
  });
});
