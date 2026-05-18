import { layout, prepare, type PreparedText } from "@chenglou/pretext";

import type {
  FeedItemType,
  FeedMediaPreview,
  FeedRichTextSegment,
  ModuleSize,
  PresentationIntent,
} from "./types";

export type FeedLayoutItem = {
  id: string;
  media: FeedMediaPreview[];
  presentationIntent?: PresentationIntent | null;
  source: string;
  summary: string;
  summaryRichText?: FeedRichTextSegment[];
  title: string;
  type: FeedItemType;
};

export type TextMeasureInput = {
  font: string;
  lineHeight: number;
  maxWidth: number;
  text: string;
  whiteSpace?: "normal" | "pre-wrap";
};

export type TextMeasureResult = {
  height: number;
  lineCount: number;
};

export type TextMeasurer = (input: TextMeasureInput) => TextMeasureResult;

export type FeedModuleEstimate = {
  chromeHeight: number;
  height: number;
  mediaHeight: number;
  moduleSize: ModuleSize;
  textHeight: number;
};

export type FeedLayoutEntry<T extends FeedLayoutItem> = {
  estimate: FeedModuleEstimate;
  item: T;
};

export type FeedLayoutColumn<T extends FeedLayoutItem> = {
  height: number;
  items: FeedLayoutEntry<T>[];
};

export type FeedLayout<T extends FeedLayoutItem> = {
  columnWidth: number;
  columns: FeedLayoutColumn<T>[];
};

type EstimateOptions = {
  columnWidth: number;
  measureText?: TextMeasurer;
};

type AssignOptions = {
  columnCount: number;
  containerWidth: number;
  gap: number;
  measureText?: TextMeasurer;
};

const SUMMARY_FONT = "15.2px \"Instrument Sans\"";
const TITLE_FONT = "600 21.6px Libre Bodoni";
const META_FONT = "12px \"Instrument Sans\"";

const SUMMARY_LINE_HEIGHT = 23;
const TITLE_LINE_HEIGHT = 24;
const META_LINE_HEIGHT = 16;

const CHROME_HEIGHT_BY_SIZE: Record<ModuleSize, number> = {
  compact: 116,
  feature: 148,
  standard: 132,
};

const DEFAULT_MEDIA_RATIO = 10 / 16;

const preparedTextCache = new Map<string, PreparedText>();

export function getFeedModuleSize(item: FeedLayoutItem): ModuleSize {
  if (item.presentationIntent === "feature") {
    return "feature";
  }

  if (item.type === "social" && item.media.length === 0) {
    return "compact";
  }

  return "standard";
}

export const flattenFeedRichText = (segments: FeedRichTextSegment[] = []) =>
  segments.map((segment) => segment.plainText).join("");

export const createPretextTextMeasurer = (): TextMeasurer => (input) => {
  const whiteSpace = input.whiteSpace ?? "normal";
  const cacheKey = `${input.font}\n${whiteSpace}\n${input.text}`;
  let prepared = preparedTextCache.get(cacheKey);

  if (!prepared) {
    prepared = prepare(input.text, input.font, { whiteSpace });
    preparedTextCache.set(cacheKey, prepared);
  }

  return layout(prepared, input.maxWidth, input.lineHeight);
};

function measureVisibleText(
  item: FeedLayoutItem,
  columnWidth: number,
  measureText: TextMeasurer,
) {
  const textWidth = Math.max(1, columnWidth - 36);
  const titleHeight =
    item.source === "telegram"
      ? 0
      : measureText({
          font: TITLE_FONT,
          lineHeight: TITLE_LINE_HEIGHT,
          maxWidth: textWidth,
          text: item.title,
        }).height;
  const summaryText = item.summaryRichText?.length
    ? flattenFeedRichText(item.summaryRichText)
    : item.summary;
  const summaryHeight = summaryText
    ? measureText({
        font: SUMMARY_FONT,
        lineHeight: SUMMARY_LINE_HEIGHT,
        maxWidth: textWidth,
        text: summaryText,
        whiteSpace: "pre-wrap",
      }).height
    : 0;
  const metaHeight = measureText({
    font: META_FONT,
    lineHeight: META_LINE_HEIGHT,
    maxWidth: textWidth,
    text: item.source === "telegram" ? "Telegram" : item.type,
  }).height;

  return titleHeight + summaryHeight + metaHeight;
}

function estimateMediaHeight(media: FeedMediaPreview[], columnWidth: number) {
  if (media.length === 0) {
    return 0;
  }

  if (media.length === 1) {
    const [preview] = media;
    const ratio =
      preview && preview.width && preview.height
        ? preview.height / preview.width
        : DEFAULT_MEDIA_RATIO;

    return columnWidth * ratio;
  }

  const rowCount = Math.ceil(media.length / 2);
  const firstSpansTwo = media.length % 2 === 1;
  const firstRowHeight = firstSpansTwo ? columnWidth * DEFAULT_MEDIA_RATIO : columnWidth / 2;
  const remainingRows = firstSpansTwo ? rowCount - 1 : rowCount;

  return firstRowHeight + remainingRows * (columnWidth / 2);
}

export function estimateFeedModule(
  item: FeedLayoutItem,
  { columnWidth, measureText = createPretextTextMeasurer() }: EstimateOptions,
): FeedModuleEstimate {
  const moduleSize = getFeedModuleSize(item);
  const chromeHeight = CHROME_HEIGHT_BY_SIZE[moduleSize];
  const mediaHeight = estimateMediaHeight(item.media, columnWidth);
  const textHeight = measureVisibleText(item, columnWidth, measureText);

  return {
    chromeHeight,
    height: chromeHeight + mediaHeight + textHeight,
    mediaHeight,
    moduleSize,
    textHeight,
  };
}

export function assignFeedLayout<T extends FeedLayoutItem>(
  items: T[],
  { columnCount, containerWidth, gap, measureText }: AssignOptions,
): FeedLayout<T> {
  const safeColumnCount = Math.max(1, columnCount);
  const columnWidth =
    (Math.max(1, containerWidth) - gap * (safeColumnCount - 1)) / safeColumnCount;
  const columns = Array.from({ length: safeColumnCount }, () => ({
    height: 0,
    items: [] as FeedLayoutEntry<T>[],
  }));

  for (const item of items) {
    const estimate = estimateFeedModule(item, { columnWidth, measureText });
    const shortestColumn = columns.reduce(
      (shortestIndex, column, index) =>
        column.height < columns[shortestIndex].height ? index : shortestIndex,
      0,
    );

    columns[shortestColumn].items.push({ estimate, item });
    columns[shortestColumn].height += estimate.height + gap;
  }

  return { columnWidth, columns };
}
