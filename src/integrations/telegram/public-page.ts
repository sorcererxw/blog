import { load, type CheerioAPI } from "cheerio";

import type {
  ThoughtPhoto,
  ThoughtRichTextSegment,
  ThoughtWebpage,
} from "../../domains/thoughts/types";
import {
  TELEGRAM_CHANNEL_USERNAME,
  type TelegramThoughtRecord,
} from "./thoughts";

type CheerioSelection = ReturnType<CheerioAPI>;

const HTML_ENTITY_MAP: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

const TELEGRAM_PUBLIC_PAGE_USER_AGENT =
  "Mozilla/5.0 (compatible; PersonalSiteTelegramCrawler/1.0)";

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, digits) =>
      String.fromCodePoint(Number.parseInt(digits, 10)),
    )
    .replace(/&([a-z]+);/gi, (match, name) => HTML_ENTITY_MAP[name] ?? match);

const currentStyles = (
  stack: Array<Partial<ThoughtRichTextSegment>>,
): Partial<ThoughtRichTextSegment> => Object.assign({}, ...stack);

const mergeSegments = (
  segments: ThoughtRichTextSegment[],
): ThoughtRichTextSegment[] => {
  const merged: ThoughtRichTextSegment[] = [];

  for (const segment of segments) {
    const previous = merged.at(-1);
    const sameStyle =
      previous &&
      previous.url === segment.url &&
      previous.bold === segment.bold &&
      previous.italic === segment.italic &&
      previous.underline === segment.underline &&
      previous.strike === segment.strike &&
      previous.monospace === segment.monospace &&
      previous.quote === segment.quote &&
      previous.hashTag === segment.hashTag;

    if (sameStyle) {
      previous.plainText += segment.plainText;
      continue;
    }

    merged.push({ ...segment });
  }

  return merged;
};

export const parseTelegramWidgetRichText = (
  html: string,
): ThoughtRichTextSegment[] => {
  const segments: ThoughtRichTextSegment[] = [];
  const stack: Array<Partial<ThoughtRichTextSegment>> = [];
  const tokens = html.match(/<[^>]+>|[^<]+/g) ?? [];

  for (const token of tokens) {
    if (token.startsWith("<")) {
      if (/^<br\s*\/?>$/i.test(token)) {
        segments.push({ plainText: "\n" });
        continue;
      }

      const closing = token.match(/^<\/\s*([a-z0-9]+)\s*>$/i);
      if (closing) {
        stack.pop();
        continue;
      }

      const tagMatch = token.match(/^<\s*([a-z0-9]+)([^>]*)>$/i);
      if (!tagMatch) {
        continue;
      }

      const [, tagName, attrs] = tagMatch;
      const nextStyle: Partial<ThoughtRichTextSegment> = {};
      const lowerTag = tagName.toLowerCase();

      if (lowerTag === "a") {
        const hrefMatch = attrs.match(/\shref="([^"]+)"/i);
        if (hrefMatch) {
          nextStyle.url = decodeHtmlEntities(hrefMatch[1]);
        }
      } else if (lowerTag === "b" || lowerTag === "strong") {
        nextStyle.bold = true;
      } else if (lowerTag === "i" || lowerTag === "em") {
        nextStyle.italic = true;
      } else if (lowerTag === "u") {
        nextStyle.underline = true;
      } else if (
        lowerTag === "s" ||
        lowerTag === "strike" ||
        lowerTag === "del"
      ) {
        nextStyle.strike = true;
      } else if (lowerTag === "code" || lowerTag === "pre") {
        nextStyle.monospace = true;
      } else if (lowerTag === "blockquote") {
        nextStyle.quote = true;
      }

      stack.push(nextStyle);
      continue;
    }

    let plainText = decodeHtmlEntities(token);

    if (!plainText.trim()) {
      if (token.includes("\n")) {
        continue;
      }

      segments.push({ plainText });
      continue;
    }

    if (token.includes("\n")) {
      plainText = plainText
        .replace(/\n[ \t]+/g, "\n")
        .replace(/^[ \t]*\n[ \t]*/g, "")
        .replace(/[ \t]*\n[ \t]*$/g, "");

      if (!plainText) {
        continue;
      }
    }

    const style = currentStyles(stack);
    const segment: ThoughtRichTextSegment = {
      plainText,
      ...style,
    };

    if (segment.plainText.startsWith("#")) {
      segment.hashTag = true;
    }

    segments.push(segment);
  }

  return mergeSegments(
    segments.filter((segment) => segment.plainText.length > 0),
  );
};

const decodeText = (html: string) =>
  parseTelegramWidgetRichText(html)
    .map((segment) => segment.plainText)
    .join("")
    .trim();

const readBackgroundImageUrl = (style?: string) => {
  if (!style) {
    return null;
  }

  return (
    style.match(/background-image\s*:\s*url\(['"]?([^'")]+)['"]?\)/i)?.[1] ??
    null
  );
};

const readPx = (value?: string) => {
  if (!value) {
    return null;
  }

  const match = value.match(/([\d.]+)px/i);
  if (!match) {
    return null;
  }

  const parsed = Number.parseFloat(match[1]);
  return Number.isFinite(parsed) && parsed > 32 ? Math.round(parsed) : null;
};

const readPercent = (value?: string) => {
  if (!value) {
    return null;
  }

  const match = value.match(/([\d.]+)%/);
  if (!match) {
    return null;
  }

  const parsed = Number.parseFloat(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const readInlineStyleDeclaration = (style: string | undefined, name: string) =>
  style
    ?.split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.toLowerCase().startsWith(`${name}:`))
    ?.split(":")
    .slice(1)
    .join(":")
    .trim();

const imageDimensionsFromNode = (
  $: CheerioAPI,
  node: CheerioSelection,
) => {
  const style = node.attr("style");
  const width =
    readPx(readInlineStyleDeclaration(style, "width")) ??
    readPx(node.css("width"));
  const explicitHeight =
    readPx(readInlineStyleDeclaration(style, "height")) ??
    readPx(node.css("height"));
  const aspectRatio = readPercent(
    node.find(".tgme_widget_message_photo,.link_preview_image,.link_preview_right_image").first().attr("style") ??
      node.find(".tgme_widget_message_photo,.link_preview_image,.link_preview_right_image").first().css("padding-top") ??
      readInlineStyleDeclaration(style, "padding-top"),
  );
  const height =
    explicitHeight ??
    (width && aspectRatio ? Math.round(width * (aspectRatio / 100)) : null);

  return {
    height,
    width,
  };
};

const createPhoto = ({
  height,
  id,
  url,
  width,
}: {
  height?: number | null;
  id: number;
  url: string;
  width?: number | null;
}): ThoughtPhoto => ({
  height: height ?? null,
  id,
  originalUrl: url,
  thumbnailUrl: url,
  width: width ?? null,
});

const extractMessagePhotos = (
  $: CheerioAPI,
  message: CheerioSelection,
  id: number,
): ThoughtPhoto[] => {
  const photos: ThoughtPhoto[] = [];
  let index = 0;

  message
    .find(".tgme_widget_message_photo_wrap,.tgme_widget_message_service_photo")
    .each((_, element) => {
      const node = $(element);
      const url = readBackgroundImageUrl(node.attr("style"));
      if (!url) {
        return;
      }

      const dimensions = imageDimensionsFromNode($, node);
      photos.push(
        createPhoto({
          ...dimensions,
          id: id * 1000 + index,
          url,
        }),
      );
      index += 1;
    });

  return photos;
};

const extractPreviewPhoto = (
  $: CheerioAPI,
  preview: CheerioSelection,
  id: number,
): ThoughtPhoto | null => {
  const imageNode = preview
    .find(".link_preview_image,.link_preview_right_image")
    .first();
  const url = readBackgroundImageUrl(imageNode.attr("style"));

  if (!url) {
    return null;
  }

  return createPhoto({
    ...imageDimensionsFromNode($, imageNode),
    id: id * 1000 + 900,
    url,
  });
};

const extractWebpage = (
  $: CheerioAPI,
  message: CheerioSelection,
  id: number,
): ThoughtWebpage | null => {
  const preview = message.find(".tgme_widget_message_link_preview").first();
  const href = preview.attr("href");

  if (!href) {
    return null;
  }

  const siteNameHtml = preview.find(".link_preview_site_name").first().html();
  const titleHtml = preview.find(".link_preview_title").first().html();
  const descriptionHtml = preview.find(".link_preview_description").first().html();
  const displayUrl = siteNameHtml ? decodeText(siteNameHtml) : "";

  return {
    author: "",
    description: descriptionHtml ? decodeText(descriptionHtml) : "",
    displayUrl: displayUrl || href,
    embedUrl: href,
    photo: extractPreviewPhoto($, preview, id),
    sitename: displayUrl,
    title: titleHtml ? decodeText(titleHtml) : "",
    url: href,
  };
};

const extractReplyTo = (message: CheerioSelection) => {
  const href = message.find(".tgme_widget_message_reply").first().attr("href");
  return href?.match(/\/(\d+)(?:\?|$)/)?.[1] ?? null;
};

const extractForwardedFrom = ($: CheerioAPI, message: CheerioSelection) => {
  const source = message.find(".tgme_widget_message_forwarded_from_name").first();
  const html = source.html();
  return html ? decodeText(html) : null;
};

const extractReactions = ($: CheerioAPI, message: CheerioSelection) =>
  message
    .find(".tgme_reaction")
    .toArray()
    .flatMap((element) => {
      const node = $(element);
      const emoticon = node.find("b").first().text();
      const countText = node.text().replace(emoticon, "").trim();
      const count = Number(countText);

      if (!emoticon || !Number.isFinite(count) || count <= 0) {
        return [];
      }

      return [{ emoticon, count }];
    });

const parseTelegramPublicPageThoughtRecords = ({
  channelUsername = TELEGRAM_CHANNEL_USERNAME,
  html,
}: {
  channelUsername?: string;
  html: string;
}): {
  nextUrl: string | null;
  records: TelegramThoughtRecord[];
} => {
  const $ = load(html);
  const records: TelegramThoughtRecord[] = [];

  $(".tgme_widget_message_wrap").each((_, element) => {
    const wrapper = $(element);
    if (wrapper.find(".tme_no_messages_found").length > 0) {
      return;
    }

    const message = wrapper.find(".js-widget_message").first();
    const post = message.attr("data-post");
    const idText = post?.match(/\/(\d+)$/)?.[1];
    const id = idText ? Number(idText) : null;
    const datetime = message.find(".tgme_widget_message_date time").attr("datetime");

    if (!idText || !id || !datetime) {
      return;
    }

    const textHtml = message
      .find(".tgme_widget_message_bubble > .tgme_widget_message_text.js-message_text,.media_supported_cont > .tgme_widget_message_text.js-message_text")
      .first()
      .html();

    records.push({
      date: new Date(datetime),
      forwardedFrom: extractForwardedFrom($, message),
      id,
      link: `https://t.me/s/${channelUsername}/${idText}`,
      photos: extractMessagePhotos($, message, id),
      reactions: extractReactions($, message),
      replyTo: extractReplyTo(message),
      richText: textHtml ? parseTelegramWidgetRichText(textHtml) : [],
      webpage: extractWebpage($, message, id),
    });
  });

  const moreLink = $("a.js-messages_more[data-before]").first();
  const href = moreLink.attr("href");
  const dataBefore = moreLink.attr("data-before");
  const nextUrl =
    href ?? (dataBefore ? `/s/${channelUsername}?before=${dataBefore}` : null);

  return {
    nextUrl,
    records,
  };
};

const resolveTelegramPublicPageUrl = (
  channelUsername: string,
  pageUrl?: string,
) =>
  pageUrl
    ? new URL(pageUrl, `https://t.me/s/${channelUsername}`).toString()
    : `https://t.me/s/${channelUsername}`;

export async function scrapeTelegramPublicPageThoughtRecords({
  channelUsername,
  fetchImpl = fetch,
  html,
  maxPages = 200,
  revalidateSeconds = 600,
}: {
  channelUsername?: string;
  fetchImpl?: typeof fetch;
  html?: string;
  maxPages?: number;
  revalidateSeconds?: number;
} = {}): Promise<TelegramThoughtRecord[]> {
  const resolvedChannel = channelUsername ?? TELEGRAM_CHANNEL_USERNAME;

  if (html) {
    return parseTelegramPublicPageThoughtRecords({
      channelUsername: resolvedChannel,
      html,
    }).records.sort((left, right) => right.date.getTime() - left.date.getTime());
  }

  const records = new Map<string, TelegramThoughtRecord>();
  const seenUrls = new Set<string>();
  const seenBeforeTokens = new Set<string>();
  let nextUrl: string | null = resolveTelegramPublicPageUrl(resolvedChannel);

  for (let page = 0; nextUrl && page < maxPages; page += 1) {
    const requestUrl = resolveTelegramPublicPageUrl(resolvedChannel, nextUrl);
    const beforeToken = new URL(requestUrl).searchParams.get("before");

    if (seenUrls.has(requestUrl)) {
      break;
    }
    seenUrls.add(requestUrl);

    if (beforeToken) {
      if (seenBeforeTokens.has(beforeToken)) {
        break;
      }
      seenBeforeTokens.add(beforeToken);
    }

    const requestInit = {
      headers: {
        "user-agent": TELEGRAM_PUBLIC_PAGE_USER_AGENT,
      },
      next: { revalidate: revalidateSeconds },
    } as RequestInit & { next: { revalidate: number } };

    const response = await fetchImpl(requestUrl, requestInit);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch Telegram public page for @${resolvedChannel}: ${response.status}`,
      );
    }

    const pageResult = parseTelegramPublicPageThoughtRecords({
      channelUsername: resolvedChannel,
      html: await response.text(),
    });

    if (pageResult.records.length === 0) {
      break;
    }

    for (const record of pageResult.records) {
      records.set(String(record.id), record);
    }

    nextUrl = pageResult.nextUrl;
  }

  return Array.from(records.values()).sort(
    (left, right) => right.date.getTime() - left.date.getTime(),
  );
}
