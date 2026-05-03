import { buildAbsoluteUrl, normalizePathname, SITE_NAME } from "./site";

import type { SeoBuildInput, SeoDocument, SeoImage } from "./model";

function toPageTitle(title: string) {
  return title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
}

function toAbsoluteImage(image?: SeoImage | null) {
  if (!image) {
    return null;
  }

  if (image.url.startsWith("http://") || image.url.startsWith("https://")) {
    return image;
  }

  return {
    ...image,
    url: buildAbsoluteUrl(image.url),
  };
}

function buildRobots(indexable: boolean) {
  return indexable
    ? "index,follow,max-image-preview:large"
    : "noindex,nofollow,max-image-preview:large";
}

export function buildSeo(input: SeoBuildInput): SeoDocument {
  const indexable = input.indexable ?? true;
  const canonicalUrl = buildAbsoluteUrl(normalizePathname(input.pathname));
  const image = toAbsoluteImage(input.image ?? null);
  const title = toPageTitle(input.title);
  const ogType = input.kind === "article" ? "article" : "website";

  return {
    kind: input.kind,
    queryFamily: input.queryFamily ?? null,
    title,
    description: input.description,
    canonicalUrl,
    robots: buildRobots(indexable),
    indexable,
    openGraph: {
      title,
      description: input.description,
      type: ogType,
      url: canonicalUrl,
      image,
      publishedTime: input.publishedTime ?? null,
      modifiedTime: input.modifiedTime ?? null,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description: input.description,
      image,
    },
    structuredData: input.structuredData ?? [],
  };
}
