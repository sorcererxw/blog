export type CanonicalImageAsset = {
  canonicalUrl: string;
  host: string | null;
  id: string | null;
  isVolatile: boolean;
  sourceUrl: string;
};

const VOLATILE_HOST_PATTERNS = [
  /^cdn\d+\.telesco\.pe$/i,
  /^secure\.notion-static\.com$/i,
  /^prod-files-secure\.s3\.[^.]+\.amazonaws\.com$/i,
];

export const TRANSFORM_ALLOWED_HOST_PATTERNS = [
  /^images\.unsplash\.com$/i,
  ...VOLATILE_HOST_PATTERNS,
];

const LOCAL_ORIGIN_PROTOCOLS = new Set(["data:", "blob:"]);

export function isAllowedTransformHost(host: string) {
  return TRANSFORM_ALLOWED_HOST_PATTERNS.some((pattern) => pattern.test(host));
}

export function isVolatileImageHost(host: string) {
  return VOLATILE_HOST_PATTERNS.some((pattern) => pattern.test(host));
}

export function createCanonicalImageId(sourceUrl: string) {
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
}

export function encodeCanonicalImageSource(sourceUrl: string) {
  return Buffer.from(sourceUrl, "utf8").toString("base64url");
}

export function decodeCanonicalImageSource(encoded: string) {
  return Buffer.from(encoded, "base64url").toString("utf8");
}

export function createCanonicalImagePath(sourceUrl: string) {
  const id = createCanonicalImageId(sourceUrl);
  const encoded = encodeCanonicalImageSource(sourceUrl);
  return `/media/${id}?u=${encoded}`;
}

function readSourceHost(sourceUrl: string) {
  try {
    return new URL(sourceUrl).host;
  } catch {
    return null;
  }
}

export function isCanonicalImageCandidate(sourceUrl: string) {
  const host = readSourceHost(sourceUrl);

  return host ? isVolatileImageHost(host) : false;
}

export function resolveCanonicalImageAsset(sourceUrl: string): CanonicalImageAsset {
  if (
    !sourceUrl ||
    Array.from(LOCAL_ORIGIN_PROTOCOLS).some((protocol) => sourceUrl.startsWith(protocol))
  ) {
    return {
      canonicalUrl: sourceUrl,
      host: null,
      id: null,
      isVolatile: false,
      sourceUrl,
    };
  }

  if (sourceUrl.startsWith("/")) {
    return {
      canonicalUrl: sourceUrl,
      host: null,
      id: null,
      isVolatile: false,
      sourceUrl,
    };
  }

  const host = readSourceHost(sourceUrl);

  if (!host) {
    return {
      canonicalUrl: sourceUrl,
      host: null,
      id: null,
      isVolatile: false,
      sourceUrl,
    };
  }

  if (!isVolatileImageHost(host)) {
    return {
      canonicalUrl: sourceUrl,
      host,
      id: null,
      isVolatile: false,
      sourceUrl,
    };
  }

  const id = createCanonicalImageId(sourceUrl);

  return {
    canonicalUrl: createCanonicalImagePath(sourceUrl),
    host,
    id,
    isVolatile: true,
    sourceUrl,
  };
}

export function isSafeCanonicalSourceUrl(sourceUrl: string) {
  try {
    const parsed = new URL(sourceUrl);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }

    if (!parsed.hostname) {
      return false;
    }

    if (parsed.hostname === "localhost") {
      return false;
    }

    if (/^\d+\.\d+\.\d+\.\d+$/.test(parsed.hostname)) {
      return false;
    }

    return isVolatileImageHost(parsed.hostname);
  } catch {
    return false;
  }
}
