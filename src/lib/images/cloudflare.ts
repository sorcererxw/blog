import {
  isAllowedTransformHost,
  resolveCanonicalImageAsset,
} from "@/domains/media/canonical-image";

export type CloudflareImagePreset =
  | "hero"
  | "article-card"
  | "content-image"
  | "bookmark-thumb"
  | "thought-photo"
  | "icon";

type CloudflareImagePresetConfig = {
  fit?: "cover" | "contain";
  quality: number;
  sizes: string;
  width: number;
  widths: number[];
};

const PRESETS: Record<CloudflareImagePreset, CloudflareImagePresetConfig> = {
  hero: {
    fit: "cover",
    quality: 85,
    sizes: "(min-width: 1200px) 1120px, 100vw",
    width: 1600,
    widths: [640, 960, 1280, 1600],
  },
  "article-card": {
    fit: "cover",
    quality: 82,
    sizes: "(min-width: 1200px) 520px, (min-width: 768px) 50vw, 100vw",
    width: 960,
    widths: [360, 540, 720, 960],
  },
  "content-image": {
    fit: "contain",
    quality: 84,
    sizes: "(min-width: 1024px) 760px, 100vw",
    width: 1200,
    widths: [480, 720, 960, 1200],
  },
  "bookmark-thumb": {
    fit: "cover",
    quality: 80,
    sizes: "(min-width: 1024px) 360px, 100vw",
    width: 720,
    widths: [240, 360, 480, 720],
  },
  "thought-photo": {
    fit: "cover",
    quality: 82,
    sizes: "(min-width: 1200px) 360px, (min-width: 768px) 50vw, 100vw",
    width: 960,
    widths: [320, 480, 720, 960],
  },
  icon: {
    fit: "contain",
    quality: 80,
    sizes: "40px",
    width: 80,
    widths: [40, 80],
  },
};

function shouldBypassTransform(sourceUrl: string) {
  if (!sourceUrl) {
    return true;
  }

  if (sourceUrl.startsWith("data:") || sourceUrl.startsWith("blob:")) {
    return true;
  }

  if (sourceUrl.endsWith(".svg") || sourceUrl.includes(".svg?")) {
    return true;
  }

  if (sourceUrl.startsWith("/")) {
    return false;
  }

  try {
    return !isAllowedTransformHost(new URL(sourceUrl).host);
  } catch {
    return true;
  }
}

function encodeSourceForCloudflare(sourceUrl: string) {
  return sourceUrl.startsWith("/") ? sourceUrl.replace(/^\/+/, "") : encodeURI(sourceUrl);
}

function formatOptions(options: Record<string, string | number | undefined>) {
  return Object.entries(options)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(",");
}

export function getCloudflareImagePreset(
  preset: CloudflareImagePreset,
): CloudflareImagePresetConfig {
  return PRESETS[preset];
}

export function buildCloudflareImageUrl(
  sourceUrl: string,
  preset: CloudflareImagePreset,
  options: {
    width?: number;
  } = {},
) {
  const asset = resolveCanonicalImageAsset(sourceUrl);
  const targetUrl = asset.canonicalUrl;

  if (shouldBypassTransform(targetUrl)) {
    return targetUrl;
  }

  const presetConfig = getCloudflareImagePreset(preset);
  const width = options.width ?? presetConfig.width;
  const imageOptions = formatOptions({
    fit: presetConfig.fit,
    format: "auto",
    quality: presetConfig.quality,
    width,
  });

  return `/cdn-cgi/image/${imageOptions}/${encodeSourceForCloudflare(targetUrl)}`;
}

export function buildCloudflareImageSrcSet(
  sourceUrl: string,
  preset: CloudflareImagePreset,
) {
  const asset = resolveCanonicalImageAsset(sourceUrl);
  const targetUrl = asset.canonicalUrl;

  if (shouldBypassTransform(targetUrl)) {
    return undefined;
  }

  const { widths } = getCloudflareImagePreset(preset);

  return widths
    .map((width) => `${buildCloudflareImageUrl(targetUrl, preset, { width })} ${width}w`)
    .join(", ");
}

export function getDefaultImageSizes(preset: CloudflareImagePreset) {
  return PRESETS[preset].sizes;
}
