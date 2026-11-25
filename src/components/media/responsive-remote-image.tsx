import {
  isCanonicalImageCandidate,
  resolveCanonicalImageAsset,
} from "@/domains/media/canonical-image";
import {
  buildCloudflareImageSrcSet,
  buildCloudflareImageUrl,
  getCloudflareImagePreset,
  getDefaultImageSizes,
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
  const isProduction = process.env.NODE_ENV === "production";
  const shouldUseDirectCanonicalMedia =
    isProduction && isCanonicalImageCandidate(src);

  const resolvedSrc = shouldUseDirectCanonicalMedia
    ? resolveCanonicalImageAsset(src).canonicalUrl
    : isProduction
      ? buildCloudflareImageUrl(src, preset)
      : src;
  const srcSet =
    isProduction && !shouldUseDirectCanonicalMedia
      ? buildCloudflareImageSrcSet(src, preset)
      : undefined;
  const resolvedSizes = srcSet
    ? (sizes ?? getDefaultImageSizes(preset))
    : undefined;

  return (
    <img
      alt={alt}
      className={className}
      decoding="async"
      fetchPriority={fetchPriority}
      height={imageHeight}
      loading={loading ?? (fetchPriority === "high" ? "eager" : "lazy")}
      sizes={resolvedSizes}
      src={resolvedSrc}
      srcSet={srcSet}
      width={imageWidth}
    />
  );
}
