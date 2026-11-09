import type { FeedItem, ModuleSize } from "./types";

type ModuleSizeItem = Pick<FeedItem, "type" | "media" | "presentationIntent">;

export function getFeedModuleSize(item: ModuleSizeItem): ModuleSize {
  if (item.presentationIntent === "feature") return "feature";
  if (item.type === "social" && item.media.length === 0) return "compact";
  return "standard";
}
