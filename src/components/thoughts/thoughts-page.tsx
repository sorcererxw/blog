import type { ReactNode } from "react";

import NextLink from "next/link";
import { Chip } from "@heroui/react";
import React from "react";

import { MasonryFeed } from "@/components/feed/masonry-feed";
import {
  HeroCard as Card,
  HeroCardContent as CardContent,
  HeroCardDescription as CardDescription,
  HeroCardHeader as CardHeader,
  HeroCardTitle as CardTitle,
} from "@/components/heroui/server-primitives";
import { ResponsiveRemoteImage } from "@/components/media/responsive-remote-image";
import { listThoughts } from "@/domains/thoughts/list-thoughts";
import {
  createPublicProviderCache,
  withCachedThoughtProvider,
} from "@/integrations/kv/provider-wrappers";
import type {
  ThoughtListItem,
  ThoughtRichTextSegment,
} from "@/domains/thoughts/types";
import { cn } from "@/lib/utils";

const LOCAL_ID_PREFIX = "1_";

type ThoughtItem = ThoughtListItem;

export function formatThoughtDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

const localMessageAnchor = (id: string) => `${LOCAL_ID_PREFIX}${id}`;

const replyPreview = (item: ThoughtItem, lookup: Map<string, ThoughtItem>) => {
  if (!item.replyTo) {
    return null;
  }

  const replied = lookup.get(item.replyTo);
  if (!replied) {
    return {
      href: undefined,
      text: `Replying to message #${item.replyTo}`,
    };
  }

  const text = replied.richText
    .map((segment) => segment.plainText)
    .join("")
    .trim();

  return {
    href: `#${localMessageAnchor(replied.id)}`,
    text: text || `Replying to message #${replied.id}`,
  };
};

const calculateThoughtHeight = (item: ThoughtItem) => {
  let height =
    30 +
    item.richText.reduce(
      (total, segment) => total + segment.plainText.length,
      0,
    );

  if (item.photos.length > 0) {
    height += 200;
  }

  if (item.replyTo) {
    height += 50;
  }

  if (item.webpage) {
    height += 80;
  }

  return height;
};

function renderRichText(segments: ThoughtRichTextSegment[]): ReactNode[] {
  return segments.map((segment, index) => {
    if (!segment.plainText) {
      return null;
    }

    let content: ReactNode = segment.plainText;

    if (segment.url) {
      content = (
        <NextLink
          className="pointer-events-auto break-all font-medium text-accent hover:underline"
          href={segment.url}
          rel="noreferrer"
          target="_blank"
        >
          {content}
        </NextLink>
      );
    }

    if (segment.hashTag) {
      content = <span className="font-medium text-accent">{content}</span>;
    }

    if (segment.bold) {
      content = <strong>{content}</strong>;
    }

    if (segment.italic) {
      content = <em>{content}</em>;
    }

    if (segment.underline) {
      content = <u>{content}</u>;
    }

    if (segment.monospace) {
      content = (
        <code className="rounded bg-default px-1 py-0.5 font-code text-sm">
          {content}
        </code>
      );
    }

    if (segment.strike) {
      content = <s>{content}</s>;
    }

    if (segment.quote) {
      return (
        <blockquote
          key={index}
          className="my-2 border-l-2 border-separator pl-3 text-muted"
        >
          {content}
        </blockquote>
      );
    }

    return <React.Fragment key={index}>{content}</React.Fragment>;
  });
}

function ReplyPreview({
  item,
  lookup,
}: {
  item: ThoughtItem;
  lookup: Map<string, ThoughtItem>;
}) {
  const preview = replyPreview(item, lookup);
  if (!preview) {
    return null;
  }

  const body = (
    <div className="line-clamp-2 text-sm opacity-80">
      <span className="mr-1 opacity-60">Replying to</span>
      {preview.text}
    </div>
  );

  if (!preview.href) {
    return <div className="flex flex-row border-l-2 pl-2">{body}</div>;
  }

  return (
    <NextLink
      className="pointer-events-auto relative z-10 flex flex-row border-l-2 pl-2 hover:opacity-100"
      href={preview.href}
    >
      {body}
    </NextLink>
  );
}

function WebpagePreview({ item }: { item: ThoughtItem }) {
  if (!item.webpage) {
    return null;
  }

  const photoSrc =
    item.webpage.photo?.originalUrl ?? item.webpage.photo?.thumbnailUrl ?? null;

  return (
    <Card className="my-4 gap-3 border-none bg-default/40 py-3 ring-1 ring-foreground/8">
      {photoSrc ? (
        <ResponsiveRemoteImage
          alt=""
          className="aspect-[16/9] w-full rounded-t-lg object-cover"
          height={item.webpage.photo?.height ?? 720}
          preset="thought-photo"
          src={photoSrc}
          width={item.webpage.photo?.width ?? 1280}
        />
      ) : null}
      <CardHeader className="gap-1 px-3 pb-0 pt-0">
        <div className="text-sm opacity-60">{item.webpage.sitename}</div>
        <CardTitle className="font-medium">{item.webpage.title}</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-0 pt-0">
        <CardDescription>{item.webpage.description}</CardDescription>
      </CardContent>
    </Card>
  );
}

function ThoughtsPageBody({ items }: { items: ThoughtItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-sm text-muted">
        No thoughts published yet.
      </div>
    );
  }

  const lookup = new Map(items.map((item) => [item.id, item]));

  return (
    <MasonryFeed
      calculateItemHeight={(item) => calculateThoughtHeight(item)}
      getItemKey={(item) => item.id}
      items={items}
      renderItem={(item) => {
        const dateLabel = formatThoughtDate(item.date);

        return (
          <article
            id={localMessageAnchor(item.id)}
            className="group relative overflow-hidden rounded-xl border bg-surface shadow-sm transition-all hover:shadow-md"
          >
            <NextLink
              aria-label={`Open thought from ${dateLabel} in Telegram`}
              className="absolute inset-0 z-0"
              href={item.link}
              rel="noreferrer"
              target="_blank"
            />
            <div className="relative z-10 space-y-4 p-4 pointer-events-none">
              <ReplyPreview item={item} lookup={lookup} />

              {item.forwardedFrom ? (
                <div className="mb-2 mt-4">
                  <div className="text-sm opacity-60">
                    Forwarded from {item.forwardedFrom}
                  </div>
                </div>
              ) : null}

              {item.photos.length > 0 ? (
                <div className="mb-4 grid gap-3">
                  {item.photos.map((photo) => {
                    const src = photo.originalUrl ?? photo.thumbnailUrl;
                    if (!src) {
                      return null;
                    }

                    return (
                      <ResponsiveRemoteImage
                        key={`${item.id}-${photo.id}`}
                        alt=""
                        className="w-full rounded-lg object-cover"
                        height={photo.height ?? 720}
                        preset="thought-photo"
                        src={src}
                        width={photo.width ?? 1280}
                      />
                    );
                  })}
                </div>
              ) : null}

              {item.richText.length > 0 ? (
                <div className="my-4 whitespace-pre-wrap break-words">
                  {renderRichText(item.richText)}
                </div>
              ) : null}

              <WebpagePreview item={item} />

              <div
                className={cn(
                  "my-4 grid grid-cols-[1fr_auto] items-center gap-3 px-0",
                  item.reactions.length === 0 && "grid-cols-[auto] justify-end",
                )}
              >
                <div className="grid grid-flow-col items-center justify-start gap-2">
                  {item.reactions.map((reaction, index) => (
                    <Chip key={`${item.id}-${index}`}>
                      {reaction.emoticon} {reaction.count}
                    </Chip>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-sm opacity-60">
                  <time dateTime={item.date.toISOString()}>{dateLabel}</time>
                </div>
              </div>
            </div>
          </article>
        );
      }}
    />
  );
}

export async function ThoughtsPage() {
  const providerCache = await createPublicProviderCache();
  const cachedListThoughts = withCachedThoughtProvider(
    listThoughts,
    providerCache,
  );
  const items = await cachedListThoughts();

  return (
    <section className="mx-auto w-[min(100%-2.5rem,66rem)] space-y-6">
      <ThoughtsPageBody items={items} />
    </section>
  );
}
