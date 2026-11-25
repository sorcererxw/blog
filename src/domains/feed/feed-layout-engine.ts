import type {
  FeedItemType,
  FeedMediaPreview,
  FeedQuotePreview,
  FeedRichTextSegment,
  ModuleSize,
  PresentationIntent,
} from "./types";

export type FeedLayoutItem = {
  displayedAt?: string | Date | null;
  id: string;
  media: FeedMediaPreview[];
  presentationIntent?: PresentationIntent | null;
  quote?: FeedQuotePreview | null;
  source: string;
  sourcePublishedAt?: string | Date | null;
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
  measuredHeights?: Readonly<Record<string, number>>;
};

const SUMMARY_FONT = '16px "Courier Prime"';
const SUMMARY_LINE_HEIGHT = 26;
const QUOTE_FONT = '14px "Courier Prime"';
const QUOTE_LINE_HEIGHT = 22.75;

const TITLE_STYLE_BY_SIZE: Record<
  ModuleSize,
  { font: string; lineHeight: number }
> = {
  compact: { font: '600 18px "Libre Bodoni"', lineHeight: 22.5 },
  feature: { font: '600 30px "Libre Bodoni"', lineHeight: 37.5 },
  standard: { font: '600 24px "Libre Bodoni"', lineHeight: 30 },
};

const CARD_HORIZONTAL_CHROME = 42;
const CARD_VERTICAL_PADDING_AND_BORDER = 42;
const BADGE_HEIGHT = 18;
const TIME_HEIGHT = 20;
const QUOTE_BOX_HORIZONTAL_CHROME = 34;
const QUOTE_BOX_VERTICAL_PADDING_AND_BORDER = 26;
const QUOTE_AUTHOR_HEIGHT = 26;
const DEFAULT_MEDIA_RATIO = 10 / 16;

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

function parseFontSize(font: string): number {
  const match = /(\d+(?:\.\d+)?)px/i.exec(font);
  return match ? Number(match[1]) : 16;
}

function isWideCharacter(codePoint: number): boolean {
  return (
    codePoint >= 0x1100 &&
    (codePoint <= 0x115f ||
      codePoint === 0x2329 ||
      codePoint === 0x232a ||
      (codePoint >= 0x2e80 && codePoint <= 0xa4cf && codePoint !== 0x303f) ||
      (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
      (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
      (codePoint >= 0xfe10 && codePoint <= 0xfe19) ||
      (codePoint >= 0xfe30 && codePoint <= 0xfe6f) ||
      (codePoint >= 0xff00 && codePoint <= 0xff60) ||
      (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
      codePoint >= 0x1f300)
  );
}

export const createHeuristicTextMeasurer = (): TextMeasurer => (input) => {
  const normalized =
    input.whiteSpace === "pre-wrap"
      ? input.text
      : input.text.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return { height: 0, lineCount: 0 };
  }

  const fontSize = parseFontSize(input.font);
  const isMonospace = /courier|mono/i.test(input.font);
  const narrowCharWidth = fontSize * (isMonospace ? 0.6 : 0.52);
  const wideCharWidth = fontSize * 1.02;
  const maxWidth = Math.max(fontSize, input.maxWidth);

  const paragraphs =
    input.whiteSpace === "pre-wrap" ? normalized.split("\n") : [normalized];
  let totalLines = 0;

  for (const paragraph of paragraphs) {
    if (!paragraph) {
      totalLines += 1;
      continue;
    }

    let width = 0;

    for (const char of paragraph) {
      const codePoint = char.codePointAt(0) ?? 0;
      width += isWideCharacter(codePoint) ? wideCharWidth : narrowCharWidth;
    }

    totalLines += Math.max(1, Math.ceil(width / maxWidth));
  }

  return {
    height: totalLines * input.lineHeight,
    lineCount: totalLines,
  };
};

function estimateMediaHeight(media: FeedMediaPreview[], columnWidth: number) {
  if (media.length === 0) {
    return 0;
  }

  if (media.length === 1) {
    return columnWidth * DEFAULT_MEDIA_RATIO;
  }

  const rowCount = Math.ceil(media.length / 2);
  const firstSpansTwo = media.length % 2 === 1;
  const firstRowHeight = firstSpansTwo
    ? columnWidth * DEFAULT_MEDIA_RATIO
    : columnWidth / 2;
  const remainingRows = firstSpansTwo ? rowCount - 1 : rowCount;

  return firstRowHeight + remainingRows * (columnWidth / 2) + Math.max(0, rowCount - 1);
}

function estimateQuoteMediaHeight(
  media: FeedMediaPreview[],
  innerWidth: number,
) {
  const visibleMedia = media.slice(0, 4);

  if (visibleMedia.length === 0) {
    return 0;
  }

  if (visibleMedia.length === 1) {
    const [item] = visibleMedia;
    const ratio =
      item && item.width && item.height
        ? Math.min(Math.max(item.width / item.height, 4 / 3), 2)
        : 16 / 10;

    return 12 + innerWidth / ratio;
  }

  return 12 + estimateMediaHeight(visibleMedia, innerWidth);
}

function estimateQuoteHeight(
  quote: FeedQuotePreview | null | undefined,
  textWidth: number,
  measureText: TextMeasurer,
) {
  if (!quote) {
    return 0;
  }

  const innerWidth = Math.max(1, textWidth - QUOTE_BOX_HORIZONTAL_CHROME);
  const authorHeight =
    quote.authorName || quote.authorUsername ? QUOTE_AUTHOR_HEIGHT : 0;
  const textHeight = quote.text
    ? measureText({
        font: QUOTE_FONT,
        lineHeight: QUOTE_LINE_HEIGHT,
        maxWidth: innerWidth,
        text: quote.text,
        whiteSpace: "pre-wrap",
      }).height
    : 0;
  const mediaHeight = estimateQuoteMediaHeight(quote.media, innerWidth);

  return (
    QUOTE_BOX_VERTICAL_PADDING_AND_BORDER +
    authorHeight +
    textHeight +
    mediaHeight
  );
}

function isUndatedFeedItem(item: FeedLayoutItem): boolean {
  const hasDateField =
    item.displayedAt !== undefined || item.sourcePublishedAt !== undefined;

  if (!hasDateField) {
    return false;
  }

  const raw = item.displayedAt ?? item.sourcePublishedAt;

  if (raw == null) {
    return true;
  }

  const time = raw instanceof Date ? raw.getTime() : Date.parse(raw);
  return !Number.isFinite(time) || time <= 0;
}

export function estimateFeedModule(
  item: FeedLayoutItem,
  {
    columnWidth,
    measureText = createHeuristicTextMeasurer(),
  }: EstimateOptions,
): FeedModuleEstimate {
  const moduleSize = getFeedModuleSize(item);
  const textWidth = Math.max(1, columnWidth - CARD_HORIZONTAL_CHROME);
  const hasVisibleTitle = item.source !== "telegram" && Boolean(item.title);
  const titleStyle = TITLE_STYLE_BY_SIZE[moduleSize];
  const titleHeight = hasVisibleTitle
    ? measureText({
        font: titleStyle.font,
        lineHeight: titleStyle.lineHeight,
        maxWidth: textWidth,
        text: item.title,
      }).height
    : 0;

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

  const quoteHeight = estimateQuoteHeight(item.quote, textWidth, measureText);
  const mediaHeight = estimateMediaHeight(item.media, columnWidth);

  const sectionCount =
    2 +
    (hasVisibleTitle ? 1 : 0) +
    (summaryHeight > 0 ? 1 : 0) +
    (item.quote ? 1 : 0);
  const sectionGap = moduleSize === "compact" ? 8 : 12;
  const chromeHeight =
    CARD_VERTICAL_PADDING_AND_BORDER +
    BADGE_HEIGHT +
    TIME_HEIGHT +
    sectionGap * (sectionCount - 1);
  const textHeight = titleHeight + summaryHeight + quoteHeight;

  return {
    chromeHeight,
    height: chromeHeight + mediaHeight + textHeight,
    mediaHeight,
    moduleSize,
    textHeight,
  };
}

function pickShortestColumnIndex<T extends FeedLayoutItem>(
  columns: FeedLayoutColumn<T>[],
): number {
  let shortestIndex = 0;

  for (let index = 1; index < columns.length; index += 1) {
    if (columns[index].height < columns[shortestIndex].height) {
      shortestIndex = index;
    }
  }

  return shortestIndex;
}

export function assignFeedLayout<T extends FeedLayoutItem>(
  items: T[],
  {
    columnCount,
    containerWidth,
    gap,
    measureText,
    measuredHeights,
  }: AssignOptions,
): FeedLayout<T> {
  const safeColumnCount = Math.max(1, columnCount);
  const columnWidth =
    (Math.max(1, containerWidth) - gap * (safeColumnCount - 1)) /
    safeColumnCount;
  const columns: FeedLayoutColumn<T>[] = Array.from(
    { length: safeColumnCount },
    () => ({
      height: 0,
      items: [],
    }),
  );

  const resolveEntry = (item: T): FeedLayoutEntry<T> => {
    const measured = measuredHeights?.[item.id];

    if (typeof measured === "number" && Number.isFinite(measured) && measured > 0) {
      return {
        estimate: {
          chromeHeight: 0,
          height: measured,
          mediaHeight: 0,
          moduleSize: getFeedModuleSize(item),
          textHeight: 0,
        },
        item,
      };
    }

    return {
      estimate: estimateFeedModule(item, { columnWidth, measureText }),
      item,
    };
  };

  let trailingUndatedStart = items.length;
  while (
    trailingUndatedStart > 0 &&
    isUndatedFeedItem(items[trailingUndatedStart - 1])
  ) {
    trailingUndatedStart -= 1;
  }

  const datedEntries = items.slice(0, trailingUndatedStart).map(resolveEntry);
  const trailingUndatedEntries = items
    .slice(trailingUndatedStart)
    .map(resolveEntry);

  if (safeColumnCount > 1 && trailingUndatedEntries.length > 1) {
    trailingUndatedEntries.sort(
      (left, right) => right.estimate.height - left.estimate.height,
    );
  }

  for (const entry of [...datedEntries, ...trailingUndatedEntries]) {
    const shortestIndex = pickShortestColumnIndex(columns);
    columns[shortestIndex].items.push(entry);
    columns[shortestIndex].height += entry.estimate.height + gap;
  }

  return { columnWidth, columns };
}
