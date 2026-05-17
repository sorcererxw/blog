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
