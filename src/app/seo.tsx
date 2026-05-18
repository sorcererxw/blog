import type { Metadata } from "next";

import type { SeoDocument } from "@/domains/seo/model";

export function seoToMetadata(seo: SeoDocument): Metadata {
  return {
    alternates: {
      canonical: seo.canonicalUrl,
    },
    description: seo.description,
    icons: {
      icon: [
        {
          type: "image/svg+xml",
          url: "/favicon.svg",
        },
      ],
      shortcut: [
        {
          type: "image/svg+xml",
          url: "/favicon.svg",
        },
      ],
    },
    openGraph: {
      description: seo.openGraph.description,
      images: seo.openGraph.image
        ? [
            {
              alt: seo.openGraph.image.alt,
              height: seo.openGraph.image.height ?? undefined,
              url: seo.openGraph.image.url,
              width: seo.openGraph.image.width ?? undefined,
            },
          ]
        : undefined,
      modifiedTime: seo.openGraph.modifiedTime ?? undefined,
      publishedTime: seo.openGraph.publishedTime ?? undefined,
      title: seo.openGraph.title,
      type: seo.openGraph.type,
      url: seo.openGraph.url,
    },
    robots: seo.robots,
    title: seo.title,
    twitter: {
      card: seo.twitter.card,
      description: seo.twitter.description,
      images: seo.twitter.image ? [seo.twitter.image.url] : undefined,
      title: seo.twitter.title,
    },
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
