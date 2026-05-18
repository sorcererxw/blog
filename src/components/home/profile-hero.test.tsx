import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { HomePageBlock } from "@/integrations/notion/home";

import { ProfileHero } from "./profile-hero";

describe("ProfileHero", () => {
  const blocks: HomePageBlock[] = [
    {
      id: "profile-heading",
      type: "heading_1",
      children: [],
      heading_1: {
        rich_text: [{ plain_text: "sorcererxw" }],
      },
    },
    {
      id: "profile-body",
      type: "paragraph",
      children: [],
      paragraph: {
        rich_text: [{ plain_text: "Full Notion profile content." }],
      },
    },
  ];

  it("renders the full profile page content without collapsed controls", () => {
    const markup = renderToStaticMarkup(<ProfileHero blocks={blocks} />);

    expect(markup).toContain('aria-label="Profile hero"');
    expect(markup).toContain('id="profile"');
    expect(markup).toContain("sorcererxw");
    expect(markup).toContain("Full Notion profile content.");
    expect(markup).not.toContain('href="#profile"');
    expect(markup).not.toContain("More profile");
    expect(markup).not.toContain('href="#overview"');
    expect(markup).not.toContain("Less profile");
  });
});
