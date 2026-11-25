import type { SeoDocument } from "@/domains/seo/model";

type HeadMetaTag =
  | { title: string }
  | { content: string; name: string }
  | { content: string; property: string };

type HeadLinkTag = {
  href: string;
  rel: string;
  type?: string;
};

export type RouteHeadConfig = {
  links: HeadLinkTag[];
  meta: HeadMetaTag[];
};

export function seoToHead(seo: SeoDocument): RouteHeadConfig {
  const meta: HeadMetaTag[] = [
    { title: seo.title },
    { content: seo.description, name: "description" },
    { content: seo.robots, name: "robots" },
    { content: seo.openGraph.title, property: "og:title" },
    { content: seo.openGraph.description, property: "og:description" },
    { content: seo.openGraph.type, property: "og:type" },
    { content: seo.openGraph.url, property: "og:url" },
  ];

  if (seo.openGraph.image) {
    meta.push({ content: seo.openGraph.image.url, property: "og:image" });

    if (seo.openGraph.image.alt) {
      meta.push({ content: seo.openGraph.image.alt, property: "og:image:alt" });
    }

    if (seo.openGraph.image.width) {
      meta.push({
        content: String(seo.openGraph.image.width),
        property: "og:image:width",
      });
    }

    if (seo.openGraph.image.height) {
      meta.push({
        content: String(seo.openGraph.image.height),
        property: "og:image:height",
      });
    }
  }

  if (seo.openGraph.publishedTime) {
    meta.push({
      content: seo.openGraph.publishedTime,
      property: "article:published_time",
    });
  }

  if (seo.openGraph.modifiedTime) {
    meta.push({
      content: seo.openGraph.modifiedTime,
      property: "article:modified_time",
    });
  }

  meta.push(
    { content: seo.twitter.card, name: "twitter:card" },
    { content: seo.twitter.title, name: "twitter:title" },
    { content: seo.twitter.description, name: "twitter:description" },
  );

  if (seo.twitter.image) {
    meta.push({ content: seo.twitter.image.url, name: "twitter:image" });
  }

  return {
    links: [
      { href: seo.canonicalUrl, rel: "canonical" },
      { href: "/favicon.svg", rel: "icon", type: "image/svg+xml" },
      { href: "/favicon.svg", rel: "shortcut icon", type: "image/svg+xml" },
    ],
    meta,
  };
}

export function StructuredDataScripts({ seo }: { seo: SeoDocument }) {
  return (
    <>
      {seo.structuredData.map((item, index) => (
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
          key={index}
          type="application/ld+json"
        />
      ))}
    </>
  );
}
