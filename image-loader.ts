import type { ImageLoaderProps } from "next/image";

const VOLATILE_HOST_PATTERNS = [
  /^cdn\d+\.telesco\.pe$/i,
  /^secure\.notion-static\.com$/i,
  /^prod-files-secure\.s3\.[^.]+\.amazonaws\.com$/i,
];

const TRANSFORM_ALLOWED_HOST_PATTERNS = [
  /^images\.unsplash\.com$/i,
  /^pbs\.twimg\.com$/i,
  ...VOLATILE_HOST_PATTERNS,
];

const normalizeSrc = (src: string) => (src.startsWith("/") ? src.slice(1) : src);

const isAllowedTransformHost = (host: string) =>
  TRANSFORM_ALLOWED_HOST_PATTERNS.some((pattern) => pattern.test(host));

const isVolatileImageHost = (host: string) =>
  VOLATILE_HOST_PATTERNS.some((pattern) => pattern.test(host));

const createCanonicalImageId = (sourceUrl: string) => {
  let first = 0x811c9dc5;
  let second = 0x811c9dc5;

  for (let index = 0; index < sourceUrl.length; index += 1) {
    const code = sourceUrl.charCodeAt(index);

    first ^= code;
    first = Math.imul(first, 0x01000193);

    second ^= code + (index & 255);
    second = Math.imul(second, 0x01000193);
  }

  return `${(first >>> 0).toString(16).padStart(8, "0")}${(second >>> 0)
    .toString(16)
    .padStart(8, "0")}`;
};

const encodeBase64Url = (sourceUrl: string) => {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(sourceUrl, "utf8").toString("base64url");
  }

  const bytes = new TextEncoder().encode(sourceUrl);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
};

const createCanonicalImagePath = (sourceUrl: string) =>
  `/media/${createCanonicalImageId(sourceUrl)}?u=${encodeBase64Url(sourceUrl)}`;

const shouldBypassTransform = (sourceUrl: string) => {
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
    return sourceUrl.startsWith("/media/");
  }

  try {
    return !isAllowedTransformHost(new URL(sourceUrl).host);
  } catch {
    return true;
  }
};

const resolveImageSource = (src: string) => {
  if (src.startsWith("/")) {
    return src;
  }

  try {
    const host = new URL(src).host;

    return isVolatileImageHost(host) ? createCanonicalImagePath(src) : src;
  } catch {
    return src;
  }
};

const appendDevParams = (src: string, width: number, quality?: number) => {
  const params = new URLSearchParams({ width: String(width) });

  if (quality) {
    params.set("quality", String(quality));
  }

  return `${src}${src.includes("?") ? "&" : "?"}${params.toString()}`;
};

export default function cloudflareLoader({ src, width, quality }: ImageLoaderProps) {
  if (process.env.NODE_ENV === "development") {
    return appendDevParams(src, width, quality);
  }

  const targetSrc = resolveImageSource(src);

  if (shouldBypassTransform(targetSrc)) {
    return appendDevParams(targetSrc, width, quality);
  }

  const params = [`width=${width}`, "format=auto"];

  if (quality) {
    params.push(`quality=${quality}`);
  }

  return `/cdn-cgi/image/${params.join(",")}/${normalizeSrc(targetSrc)}`;
}
