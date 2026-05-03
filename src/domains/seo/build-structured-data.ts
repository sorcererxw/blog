import { buildAbsoluteUrl, getDefaultAuthor, SITE_AUTHOR_NAME, SITE_NAME } from "./site";

import type { SeoImage, StructuredData } from "./model";

function compactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    const items = value
      .map((item) => compactValue(item))
      .filter((item) => item !== undefined);

    return items.length > 0 ? items : undefined;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value)
      .map(([key, item]) => [key, compactValue(item)] as const)
      .filter(([, item]) => item !== undefined);

    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }

  return value === undefined ? undefined : value;
}

function compactStructuredData<T extends StructuredData>(value: T): T {
  return (compactValue(value) ?? {}) as T;
}

function toImageObject(image?: SeoImage | null) {
  if (!image) {
    return undefined;
  }

  const imageObject: Record<string, unknown> = {
    "@type": "ImageObject",
    url: image.url,
  };

  if (typeof image.width === "number") {
    imageObject.width = image.width;
  }

  if (typeof image.height === "number") {
    imageObject.height = image.height;
  }

  return compactStructuredData(imageObject as StructuredData);
}

export function buildWebsiteStructuredData(description: string): StructuredData {
  return compactStructuredData({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: buildAbsoluteUrl("/"),
    description,
  });
}

export function buildPersonStructuredData(description: string): StructuredData {
  return compactStructuredData({
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE_AUTHOR_NAME,
    url: buildAbsoluteUrl("/"),
    description,
  });
}

export function buildCollectionPageStructuredData(options: {
  pathname: string;
  title: string;
  description: string;
  items: Array<{ name: string; url: string }>;
}): StructuredData[] {
  const itemList = options.items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    url:
      item.url.startsWith("http://") || item.url.startsWith("https://")
        ? item.url
        : buildAbsoluteUrl(item.url),
  }));

  return [
    compactStructuredData({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: options.title,
      description: options.description,
      url: buildAbsoluteUrl(options.pathname),
      isPartOf: {
        "@type": "WebSite",
        name: SITE_NAME,
        url: buildAbsoluteUrl("/"),
      },
    }),
    compactStructuredData({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: options.title,
      itemListElement: itemList,
    }),
  ];
}

export function buildTechArticleStructuredData(options: {
  pathname: string;
  title: string;
  description: string;
  publishedTime: string;
  modifiedTime?: string | null;
  image?: SeoImage | null;
}): StructuredData {
  const article: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: options.title,
    description: options.description,
    mainEntityOfPage: buildAbsoluteUrl(options.pathname),
    url: buildAbsoluteUrl(options.pathname),
    datePublished: options.publishedTime,
    author: getDefaultAuthor(),
    publisher: {
      "@type": "Person",
      name: SITE_AUTHOR_NAME,
      url: buildAbsoluteUrl("/"),
    },
  };

  if (options.modifiedTime) {
    article.dateModified = options.modifiedTime;
  }

  const image = toImageObject(options.image);
  if (image) {
    article.image = image;
  }

  return compactStructuredData(article as StructuredData);
}

export function buildBreadcrumbStructuredData(items: Array<{ name: string; path: string }>): StructuredData {
  return compactStructuredData({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: buildAbsoluteUrl(item.path),
    })),
  });
}
