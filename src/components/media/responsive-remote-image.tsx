import NextImage from "next/image";

import {
  isCanonicalImageCandidate,
  resolveCanonicalImageAsset,
} from "@/domains/media/canonical-image";
import {
  getDefaultImageSizes,
  getCloudflareImagePreset,
  type CloudflareImagePreset,
} from "@/lib/images/cloudflare";

type ResponsiveRemoteImageProps = {
  alt: string;
  className?: string;
  fetchPriority?: "auto" | "high" | "low";
  height?: number | null;
  loading?: "eager" | "lazy";
  preset: CloudflareImagePreset;
  sizes?: string;
  src: string;
  width?: number | null;
};

export function ResponsiveRemoteImage({
  alt,
  className,
  fetchPriority,
  height,
  loading,
  preset,
  sizes,
  src,
  width,
}: ResponsiveRemoteImageProps) {
  const presetConfig = getCloudflareImagePreset(preset);
  const imageWidth = width ?? presetConfig.width;
  const imageHeight = height ?? Math.round(presetConfig.width * 0.625);
  const shouldUseDirectCanonicalMedia =
    process.env.NODE_ENV === "production" && isCanonicalImageCandidate(src);
  const resolvedSrc = shouldUseDirectCanonicalMedia
    ? resolveCanonicalImageAsset(src).canonicalUrl
    : src;

  return (
    <NextImage
      alt={alt}
      className={className}
      fetchPriority={fetchPriority}
      height={imageHeight}
      loading={loading ?? (fetchPriority === "high" ? "eager" : "lazy")}
      sizes={shouldUseDirectCanonicalMedia ? undefined : (sizes ?? getDefaultImageSizes(preset))}
      src={resolvedSrc}
      unoptimized={shouldUseDirectCanonicalMedia || undefined}
      width={imageWidth}
    />
  );
}
