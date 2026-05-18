import { describe, expect, it } from "vitest";

import {
  buildBreadcrumbStructuredData,
  buildCollectionPageStructuredData,
  buildPersonStructuredData,
  buildTechArticleStructuredData,
  buildWebsiteStructuredData,
} from "./build-structured-data";

describe("build-structured-data", () => {
  it("builds website and person structured data", () => {
    expect(buildWebsiteStructuredData("Site description")).toMatchObject({
      "@context": "https://schema.org",
      "@type": "WebSite",
      description: "Site description",
      name: "sorcererxw'blog",
      publisher: {
        "@type": "Person",
        name: "sorcererxw",
      },
    });

    expect(buildPersonStructuredData("Author description")).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Person",
      description: "Author description",
      name: "sorcererxw",
      sameAs: [
        "https://github.com/sorcererxw",
        "https://jike.sorcererxw.com",
        "https://t.me/s/tech_bb",
      ],
    });
  });

  it("builds collection and item list structured data with absolute URLs", () => {
    const [page, list] = buildCollectionPageStructuredData({
      description: "Archive description",
      items: [{ name: "Newest Post", url: "/articles/newest-post" }],
      pathname: "/",
      title: "Writing overview",
    });

    expect(page).toMatchObject({
      "@type": "CollectionPage",
      description: "Archive description",
      url: "https://sorcererxw.com/",
    });

    expect(list).toMatchObject({
      "@type": "ItemList",
      itemListElement: [
        {
          "@type": "ListItem",
          name: "Newest Post",
          position: 1,
          url: "https://sorcererxw.com/articles/newest-post",
        },
      ],
    });
  });

  it("builds tech article structured data without undefined fields", () => {
    const article = buildTechArticleStructuredData({
      description: "How the migration landed.",
      pathname: "/articles/modern-astro",
      publishedTime: "2026-04-14T00:00:00.000Z",
      title: "Building the new blog shell",
    });

    expect(article).toMatchObject({
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: "Building the new blog shell",
      mainEntityOfPage: "https://sorcererxw.com/articles/modern-astro",
      url: "https://sorcererxw.com/articles/modern-astro",
    });
    expect(article).not.toHaveProperty("dateModified");
  });

  it("builds breadcrumb structured data", () => {
    expect(
      buildBreadcrumbStructuredData([
        { name: "Home", path: "/" },
        { name: "Writing", path: "/?type=writing" },
      ]),
    ).toMatchObject({
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          item: "https://sorcererxw.com/",
          name: "Home",
          position: 1,
        },
        {
          "@type": "ListItem",
          item: "https://sorcererxw.com/?type=writing",
          name: "Writing",
          position: 2,
        },
      ],
    });
  });
});
