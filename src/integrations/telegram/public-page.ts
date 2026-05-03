import type { ThoughtRichTextSegment } from "../../domains/thoughts/types";
import type { TelegramThoughtRecord } from "./thoughts";

const HTML_ENTITY_MAP: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

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
): Partial<ThoughtRichTextSegment> =>
  Object.assign({}, ...stack);

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

export async function scrapeTelegramPublicPageThoughtRecords({
  html,
  channelUsername,
  fetchImpl = fetch,
}: {
  html?: string;
  channelUsername?: string;
  fetchImpl?: typeof fetch;
} = {}): Promise<TelegramThoughtRecord[]> {
  const resolvedChannel = channelUsername ?? "tech_bb";
  const sourceHtml =
    html ??
    (await (async () => {
      const response = await fetchImpl(`https://t.me/s/${resolvedChannel}`, {
        headers: {
          "user-agent": "Mozilla/5.0",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch Telegram public page for @${resolvedChannel}: ${response.status}`,
        );
      }

      return response.text();
    })());

  const pageHtml = sourceHtml;

  const matches = [
    ...pageHtml.matchAll(
      /<div class="tgme_widget_message text_not_supported_wrap js-widget_message" data-post="[^/]+\/(\d+)"[\s\S]*?<div class="tgme_widget_message_footer[\s\S]*?<\/div>\s*<\/div>/g,
    ),
  ];

  const records: TelegramThoughtRecord[] = [];

  for (const match of matches) {
    const id = match[1];
    const block = match[0];
    const timeMatch = block.match(/<time datetime="([^"]+)"/);

    if (!timeMatch) {
      continue;
    }

    const textMatch = block.match(
      /<div class="tgme_widget_message_text js-message_text"[^>]*>([\s\S]*?)<\/div>/,
    );
    const replyMatch = block.match(
      /<a class="tgme_widget_message_reply[\s\S]*?href="https:\/\/t\.me\/[^"]+\/(\d+)"/,
    );
    const forwardedMatch = block.match(
      /<div class="tgme_widget_message_forwarded_from[^>]*>[\s\S]*?<span dir="auto">([\s\S]*?)<\/span>/,
    );
    const photoMatch = block.match(
      /<a class="tgme_widget_message_photo_wrap[\s\S]*?background-image:url\('([^']+)'/,
    );
    const previewMatch = block.match(
      /<a class="tgme_widget_message_link_preview" href="([^"]+)"[\s\S]*?<div class="link_preview_site_name[^>]*>([\s\S]*?)<\/div>[\s\S]*?<div class="link_preview_title"[^>]*>([\s\S]*?)<\/div>[\s\S]*?<div class="link_preview_description"[^>]*>([\s\S]*?)<\/div>/,
    );

    const reactions = [
      ...block.matchAll(
        /<span class="tgme_reaction">[\s\S]*?<b>([^<]+)<\/b>[\s\S]*?<\/i>(\d+)/g,
      ),
    ].map(([, emoticon, count]) => ({
      emoticon: decodeHtmlEntities(emoticon),
      count: Number(count),
    }));

    records.push({
      id,
      date: new Date(timeMatch[1]),
      link: `https://t.me/s/${resolvedChannel}/${id}`,
      richText: textMatch
        ? parseTelegramWidgetRichText(textMatch[1])
        : [],
      photos: photoMatch
        ? [
            {
              id: Number(id),
              originalUrl: photoMatch[1],
              thumbnailUrl: photoMatch[1],
              width: null,
              height: null,
            },
          ]
        : [],
      replyTo: replyMatch ? replyMatch[1] : null,
      forwardedFrom: forwardedMatch ? decodeText(forwardedMatch[1]) : null,
      webpage: previewMatch
        ? {
            title: decodeText(previewMatch[3]),
            description: decodeText(previewMatch[4]),
            displayUrl: decodeText(previewMatch[2]),
            url: decodeHtmlEntities(previewMatch[1]),
            sitename: decodeText(previewMatch[2]),
            embedUrl: decodeHtmlEntities(previewMatch[1]),
            author: "",
            photo: null,
          }
        : null,
      reactions,
    });
  }

  return records.sort((left, right) => right.date.getTime() - left.date.getTime());
}
