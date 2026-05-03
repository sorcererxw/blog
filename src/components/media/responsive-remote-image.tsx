import {
  buildCloudflareImageSrcSet,
  buildCloudflareImageUrl,
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
  const resolvedSrc = buildCloudflareImageUrl(src, preset);
  const srcSet = buildCloudflareImageSrcSet(src, preset);

  return (
    <img
      alt={alt}
      className={className}
      fetchPriority={fetchPriority}
      loading={loading ?? (fetchPriority === "high" ? "eager" : "lazy")}
      sizes={srcSet ? (sizes ?? getDefaultImageSizes(preset)) : undefined}
      src={resolvedSrc}
      srcSet={srcSet}
      {...(width ? { width } : {})}
      {...(height ? { height } : {})}
    />
  );
}
