import { getOptionalEnv } from "@/config/env";

import type { EnvSource } from "@/config/env";
import type { SeoImage } from "./model";

export const SITE_NAME = "sorcererxw'blog";
export const SITE_AUTHOR_NAME = "sorcererxw";
export const DEFAULT_SITE_ORIGIN = "https://sorcererxw.com";
export const DEFAULT_SOCIAL_IMAGE_PATH = "/favicon.svg";

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getSiteOrigin(source: EnvSource = process.env) {
  const configured = getOptionalEnv("PUBLIC_SITE_URL", source, DEFAULT_SITE_ORIGIN).trim();

  try {
    const url = new URL(configured);
    return stripTrailingSlash(url.origin);
  } catch {
    return DEFAULT_SITE_ORIGIN;
  }
}

export function normalizePathname(pathname: string) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const withoutIndex = withLeadingSlash.replace(/\/index\.html$/, "/");
  const withoutHtml = withoutIndex.replace(/\.html$/, "");
  const normalized = withoutHtml.replace(/\/+$/, "");

  return normalized || "/";
}

export function buildAbsoluteUrl(pathname: string, source: EnvSource = process.env) {
  return `${getSiteOrigin(source)}${normalizePathname(pathname)}`;
}

export function getDefaultAuthor() {
  return {
    "@type": "Person" as const,
    name: SITE_AUTHOR_NAME,
    url: getSiteOrigin(),
  };
}

export function getDefaultSocialImage(): SeoImage {
  return {
    url: buildAbsoluteUrl(DEFAULT_SOCIAL_IMAGE_PATH),
    alt: SITE_NAME,
  };
}
