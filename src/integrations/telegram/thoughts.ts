import type {
  ThoughtListItem,
  ThoughtPhoto,
  ThoughtReaction,
  ThoughtRichTextSegment,
  ThoughtWebpage,
} from "../../domains/thoughts/types.ts";

export const TELEGRAM_CHANNEL_USERNAME = "tech_bb";

export type TelegramThoughtRecord = {
  id: number | string;
  date: Date;
  link: string;
  richText: ThoughtRichTextSegment[];
  photos: ThoughtPhoto[];
  replyTo: number | string | null;
  forwardedFrom: string | null;
  webpage: ThoughtWebpage | null;
  reactions: ThoughtReaction[];
};

const toDate = (value: unknown): Date => {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "number") {
    return new Date(value * 1000);
  }

  if (typeof value === "string") {
    return new Date(value);
  }

  return new Date(0);
};

const getEntityOffset = (entity: unknown): number => {
  if (typeof entity !== "object" || entity === null) {
    return 0;
  }

  const value = entity as { offset?: number };
  return value.offset ?? 0;
};

const getEntityLength = (entity: unknown): number => {
  if (typeof entity !== "object" || entity === null) {
    return 0;
  }

  const value = entity as { length?: number };
  return value.length ?? 0;
};

const entityComparator = (left: unknown, right: unknown) => {
  const leftOffset = getEntityOffset(left);
  const rightOffset = getEntityOffset(right);

  if (leftOffset !== rightOffset) {
    return leftOffset - rightOffset;
  }

  return getEntityLength(left) - getEntityLength(right);
};

const buildRichText = (
  text: string,
  entities: Array<{
    kind?: string;
    offset?: number;
    length?: number;
    params?: { url?: string };
  }> | undefined,
): ThoughtRichTextSegment[] => {
  if (!text) {
    return [];
  }

  const markers = new Set<number>([0, text.length]);
  const sourceEntities = (entities ?? []).slice().sort(entityComparator);

  for (const entity of sourceEntities) {
    const offset = Math.max(0, getEntityOffset(entity));
    const end = Math.min(text.length, offset + Math.max(0, getEntityLength(entity)));

    markers.add(offset);
    markers.add(end);
  }

  const points = Array.from(markers).sort((left, right) => left - right);
  const segments: ThoughtRichTextSegment[] = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];

    if (end <= start) {
      continue;
    }

    const plainText = text.slice(start, end);
    if (!plainText) {
      continue;
    }

    const segment: ThoughtRichTextSegment = { plainText };

    for (const entity of sourceEntities) {
      const offset = getEntityOffset(entity);
      const entityEnd = offset + getEntityLength(entity);

      if (offset > start || entityEnd <= start) {
        continue;
      }

      const entityType = entity.kind ?? "";
      if (entityType === "url") {
        segment.url = plainText;
      } else if (entityType === "text_link") {
        segment.url = entity.params?.url ?? null;
      } else if (entityType === "bold") {
        segment.bold = true;
      } else if (entityType === "italic") {
        segment.italic = true;
      } else if (entityType === "underline") {
        segment.underline = true;
      } else if (entityType === "strikethrough") {
        segment.strike = true;
      } else if (entityType === "code" || entityType === "pre") {
        segment.monospace = true;
      } else if (entityType === "blockquote" || entityType === "expandable_blockquote") {
        segment.quote = true;
      } else if (entityType === "hashtag") {
        segment.hashTag = true;
      }
    }

    segments.push(segment);
  }

  return segments;
};

const normalizeWebpage = (webpage: unknown): ThoughtWebpage | null => {
  if (typeof webpage !== "object" || webpage === null) {
    return null;
  }

  const value = webpage as {
    title?: string;
    description?: string;
    displayUrl?: string;
    url?: string;
    siteName?: string;
    embedUrl?: string;
    author?: string;
    photo?: unknown;
  };

  if (!value.url) {
    return null;
  }

  return {
    title: value.title ?? "",
    description: value.description ?? "",
    displayUrl: value.displayUrl ?? value.url,
    url: value.url,
    sitename: value.siteName ?? "",
    embedUrl: value.embedUrl ?? value.url,
    author: value.author ?? "",
    photo: null,
  };
};

const normalizePhotos = (media: unknown): ThoughtPhoto[] => {
  if (typeof media !== "object" || media === null) {
    return [];
  }

  const value = media as {
    type?: string;
    photo?: {
      id?: number;
      sizes?: Array<{
        url?: string;
        width?: number;
        height?: number;
      }>;
      originalInfo?: {
        url?: string;
        width?: number;
        height?: number;
      } | null;
    } | null;
  };

  if (value.type !== "photo" || !value.photo) {
    return [];
  }

  const seen = new WeakSet<object>();
  const collected: Array<{ url: string; width?: number; height?: number }> = [];
  const visit = (node: unknown) => {
    if (typeof node !== "object" || node === null) {
      return;
    }

    if (seen.has(node)) {
      return;
    }
    seen.add(node);

    const candidate = node as { url?: unknown; width?: unknown; height?: unknown };
    if (typeof candidate.url === "string" && candidate.url.length > 0) {
      collected.push({
        url: candidate.url,
        width: typeof candidate.width === "number" ? candidate.width : undefined,
        height: typeof candidate.height === "number" ? candidate.height : undefined,
      });
    }

    if (Array.isArray(node)) {
      for (const entry of node) {
        visit(entry);
      }
      return;
    }

    for (const key of Reflect.ownKeys(node)) {
      if (typeof key === "string") {
        visit((node as Record<string, unknown>)[key]);
      }
    }
  };

  visit(value.photo.sizes);
  visit(value.photo.originalInfo);
  visit(value.photo);

  const sorted = collected
    .slice()
    .sort(
      (left, right) =>
        ((left.width ?? 0) * (left.height ?? 0)) - ((right.width ?? 0) * (right.height ?? 0)),
    );

  const thumb = sorted[0];
  const original = sorted.at(-1);
  const fallbackOriginal = value.photo.originalInfo?.url
    ? value.photo.originalInfo
    : null;
  const finalOriginal = fallbackOriginal ?? original ?? thumb;

  if (!thumb?.url && !finalOriginal?.url) {
    return [];
  }

  return [
    {
      id: value.photo.id ?? 0,
      thumbnailUrl: thumb?.url ?? finalOriginal?.url ?? null,
      originalUrl: finalOriginal?.url ?? thumb?.url ?? null,
      width: finalOriginal?.width ?? thumb?.width ?? null,
      height: finalOriginal?.height ?? thumb?.height ?? null,
    },
  ];
};

const normalizeReactions = (reactions: unknown): ThoughtReaction[] => {
  if (typeof reactions !== "object" || reactions === null) {
    return [];
  }

  const value = reactions as { reactions?: unknown[]; results?: unknown[] };
  const items = Array.isArray(value.reactions)
    ? value.reactions
    : Array.isArray(value.results)
      ? value.results
      : [];

  return items.flatMap((item) => {
    if (typeof item !== "object" || item === null) {
      return [];
    }

    const reaction = item as {
      count?: number;
      emoji?: string;
      reaction?: { type?: string; emoji?: string };
      type?: string;
    };

    const count = reaction.count ?? 0;
    const emoticon =
      reaction.reaction?.emoji ??
      reaction.emoji ??
      (reaction.type === "emoji" ? reaction.reaction?.emoji ?? reaction.emoji : undefined);

    if (!emoticon || count <= 0) {
      return [];
    }

    return [{ emoticon, count }];
  });
};

const normalizeForwardedFrom = (forward: unknown): string | null => {
  if (typeof forward !== "object" || forward === null) {
    return null;
  }

  const value = forward as {
    fromChat?: () => { username?: string | null; title?: string | null } | null;
    signature?: string | null;
    sender?: {
      displayName?: string;
      username?: string | null;
    } | null;
  };

  const chat = value.fromChat?.() ?? null;
  if (chat) {
    return chat.username ?? chat.title ?? null;
  }

  return value.sender?.username ?? value.sender?.displayName ?? value.signature ?? null;
};

export const normalizeTelegramThoughtRecord = (
  record: TelegramThoughtRecord,
): ThoughtListItem => ({
  id: String(record.id),
  date: record.date,
  link: record.link,
  richText: record.richText,
  photos: record.photos,
  replyTo: record.replyTo == null ? null : String(record.replyTo),
  forwardedFrom: record.forwardedFrom,
  webpage: record.webpage,
  reactions: record.reactions,
});

export const buildTelegramThoughtRecord = (message: {
  id?: number | string;
  date?: Date | number | string;
  text?: string;
  caption?: string;
  entities?: Array<{
    kind?: string;
    offset?: number;
    length?: number;
    params?: { url?: string };
  }>;
  captionEntities?: Array<{
    kind?: string;
    offset?: number;
    length?: number;
    params?: { url?: string };
  }>;
  media?: {
    type?: string;
    preview?: unknown;
  } | null;
  replyToMessage?: {
    id?: number | string | null;
  } | null;
  forward?: unknown;
  reactions?: unknown;
}): TelegramThoughtRecord | null => {
  if (typeof message.id !== "number" && typeof message.id !== "string") {
    return null;
  }

  const text = message.text ?? message.caption ?? "";
  const entities = message.entities ?? message.captionEntities ?? [];
  const webpage =
    message.media?.type === "webpage"
      ? normalizeWebpage(message.media.preview)
      : null;

  return {
    id: message.id,
    date: toDate(message.date),
    link: `https://t.me/s/${TELEGRAM_CHANNEL_USERNAME}/${String(message.id)}`,
    richText: buildRichText(text, entities),
    photos: normalizePhotos(message.media),
    replyTo: message.replyToMessage?.id ?? null,
    forwardedFrom: normalizeForwardedFrom(message.forward),
    webpage,
    reactions: normalizeReactions(message.reactions),
  };
};
