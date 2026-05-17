import NextImage from "next/image";

import cloudflareImageLoader from "../../../image-loader";
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

  return (
    <NextImage
      alt={alt}
      className={className}
      fetchPriority={fetchPriority}
      height={imageHeight}
      loader={cloudflareImageLoader}
      loading={loading ?? (fetchPriority === "high" ? "eager" : "lazy")}
      sizes={sizes ?? getDefaultImageSizes(preset)}
      src={src}
      width={imageWidth}
    />
  );
}
