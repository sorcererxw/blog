"use client";

import NextLink from "next/link";
import { Card, Chip, Tabs } from "@heroui/react";
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

import { ResponsiveRemoteImage } from "@/components/media/responsive-remote-image";
import { getFeedModuleSize } from "@/domains/feed/feed-module-size";
import type { FeedPagination } from "@/domains/feed/feed-pagination";
import type { OverviewFeedViewItem } from "@/domains/feed/overview-feed-view-model";
import { cn } from "@/lib/utils";

import masonryStyles from "./masonry-feed.module.css";
import type {
  FeedDestination,
  FeedFilter,
  FeedMediaPreview,
  FeedQuotePreview,
  FeedRichTextSegment,
  ModuleSize,
} from "@/domains/feed/types";

type OverviewFeedProps = {
  initialFilter: FeedFilter;
  items: OverviewFeedViewItem[];
  pagination?: FeedPagination;
};

type TransitionState = "active" | "enter" | "exit";

const filterLinks = [
  {
    href: "/",
    key: "all",
    label: "All",
    matches: (filter: FeedFilter) => !filter.type && !filter.source,
  },
  {
    href: "/?type=writing",
    key: "writing",
    label: "Writing",
    matches: (filter: FeedFilter) => filter.type === "writing",
  },
  {
    href: "/?type=projects",
    key: "projects",
    label: "Projects",
    matches: (filter: FeedFilter) => filter.type === "projects",
  },
  {
    href: "/?source=telegram",
    key: "telegram",
    label: "Telegram",
    matches: (filter: FeedFilter) => filter.source === "telegram",
  },
  {
    href: "/?source=x",
    key: "x",
    label: "X",
    matches: (filter: FeedFilter) => filter.source === "x",
  },
];

function getEagerMediaLimit(filter: FeedFilter) {
  return filter.type ? 3 : 2;
}

function normalizeFilter(filter: FeedFilter): FeedFilter {
  return {
    source: filter.source || null,
    type: filter.type || null,
  };
}

function matchesFilter(item: OverviewFeedViewItem, filter: FeedFilter) {
  if (filter.type && item.type !== filter.type) {
    return false;
  }

  if (filter.source && item.source !== filter.source) {
    return false;
  }

  return true;
}

function formatFeedDate(item: OverviewFeedViewItem) {
  const date = item.displayedAt ?? item.sourcePublishedAt;

  if (!date) {
    return "Undated";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(date));
}

function renderRichTextSegment(
  segment: FeedRichTextSegment,
  index: number,
): ReactNode {
  if (!segment.plainText) {
    return null;
  }

  let content: ReactNode = segment.plainText;

  if (segment.url) {
    content = (
      <NextLink
        className="break-all font-semibold text-foreground underline underline-offset-[0.12em]"
        href={segment.url}
        rel="noreferrer"
        target="_blank"
      >
        {content}
      </NextLink>
    );
  }

  if (segment.hashTag) {
    content = <span className="font-semibold text-foreground">{content}</span>;
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
        className="my-2 border-l-2 border-separator pl-3 text-foreground"
        key={index}
      >
        {content}
      </blockquote>
    );
  }

  return <Fragment key={index}>{content}</Fragment>;
}

function FeedText({ item }: { item: OverviewFeedViewItem }) {
  if (item.summaryRichText?.length) {
    return (
      <p className="m-0 whitespace-pre-wrap break-words text-base leading-relaxed text-foreground">
        {item.summaryRichText.map(renderRichTextSegment)}
      </p>
    );
  }

  return item.summary ? (
    <p className="m-0 whitespace-pre-wrap break-words text-base leading-relaxed text-foreground">
      {item.summary}
    </p>
  ) : null;
}

function MediaGrid({
  eager,
  item,
}: {
  eager: boolean;
  item: OverviewFeedViewItem;
}) {
  if (item.media.length === 0) {
    return null;
  }

  if (item.media.length === 1) {
    const [media] = item.media;

    return (
      <div className="aspect-[16/10] overflow-hidden bg-default">
        <ResponsiveRemoteImage
          alt={media.alt}
          className="h-full w-full object-cover"
          fetchPriority={eager ? "high" : undefined}
          height={media.height ?? 720}
          preset={item.source === "telegram" ? "thought-photo" : "article-card"}
          loading={eager ? "eager" : "lazy"}
          src={media.src}
          width={media.width ?? 1280}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden bg-default">
      {item.media.map((media, index) => (
        <div
          className={cn(
            "aspect-square overflow-hidden bg-default",
            item.media.length % 2 === 1 &&
              index === 0 &&
              "col-span-2 aspect-[16/10]",
          )}
          key={`${media.src}-${index}`}
        >
          <ResponsiveRemoteImage
            alt={media.alt}
            className="h-full w-full object-cover"
            fetchPriority={eager && index === 0 ? "high" : undefined}
            height={media.height ?? 720}
            preset={
              item.source === "telegram" ? "thought-photo" : "article-card"
            }
            loading={eager && index === 0 ? "eager" : "lazy"}
            src={media.src}
            width={media.width ?? 1280}
          />
        </div>
      ))}
    </div>
  );
}

function QuoteMediaGrid({ media }: { media: FeedMediaPreview[] }) {
  if (media.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-small bg-default">
      {media.slice(0, 4).map((item, index) => (
        <div className="aspect-[16/10] overflow-hidden bg-default" key={`${item.src}-${index}`}>
          <ResponsiveRemoteImage
            alt={item.alt}
            className="h-full w-full object-cover"
            height={item.height ?? 720}
            loading="lazy"
            preset="article-card"
            src={item.src}
            width={item.width ?? 1280}
          />
        </div>
      ))}
    </div>
  );
}

function QuotePreview({ quote }: { quote: FeedQuotePreview }) {
  const author = quote.authorName || quote.authorUsername;
  const handle = quote.authorUsername ? `@${quote.authorUsername}` : null;

  return (
    <NextLink
      className="block rounded-medium border border-separator px-4 py-3 text-inherit no-underline transition-colors hover:border-foreground/40"
      href={quote.url}
      rel="noreferrer"
      target="_blank"
    >
      {author || handle ? (
        <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm leading-tight text-foreground">
          {author ? <span className="font-semibold">{author}</span> : null}
          {handle ? <span className="text-foreground/70">{handle}</span> : null}
        </div>
      ) : null}
      <p className="m-0 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
        {quote.text}
      </p>
      <QuoteMediaGrid media={quote.media} />
    </NextLink>
  );
}

function ModuleInner({
  eagerMedia,
  footerDestination,
  item,
  moduleSize,
}: {
  eagerMedia: boolean;
  footerDestination?: FeedDestination | null;
  item: OverviewFeedViewItem;
  moduleSize: ModuleSize;
}) {
  const isTelegram = item.source === "telegram";
  const time = (
    <time
      className="mt-1 inline-flex items-center text-xs uppercase text-foreground"
      dateTime={item.displayedAt ?? item.sourcePublishedAt ?? undefined}
    >
      {formatFeedDate(item)}
    </time>
  );

  return (
    <>
      <MediaGrid eager={eagerMedia} item={item} />
      <div
        className={cn("grid gap-3 p-5", moduleSize === "compact" && "gap-2")}
      >
        <div className="justify-self-start">
          <Chip>{item.metaLabel ?? item.type}</Chip>
        </div>
        {isTelegram || !item.title ? null : (
          <h2
            className={cn(
              "m-0 flex items-baseline gap-2 font-heading text-2xl font-semibold leading-tight tracking-normal text-foreground",
              moduleSize === "compact" && "text-lg",
              moduleSize === "feature" && "text-3xl",
            )}
          >
            {item.titleEmoji ? (
              <span aria-hidden="true" className="shrink-0 ">
                {item.titleEmoji}
              </span>
            ) : null}
            <span>{item.title}</span>
          </h2>
        )}
        <FeedText item={item} />
        {item.quote ? <QuotePreview quote={item.quote} /> : null}
        {footerDestination && footerDestination.kind !== "none" ? (
          <NextLink
            className="justify-self-start no-underline hover:[&_time]:text-foreground hover:[&_time]:underline hover:[&_time]:underline-offset-4"
            href={footerDestination.href}
            rel={
              footerDestination.kind === "external" ? "noreferrer" : undefined
            }
            target={
              footerDestination.kind === "external" ? "_blank" : undefined
            }
          >
            {time}
          </NextLink>
        ) : (
          time
        )}
      </div>
    </>
  );
}

function isInteractiveTarget(
  target: EventTarget | null,
  currentTarget: EventTarget | null,
) {
  if (!(target instanceof Element) || !(currentTarget instanceof Element)) {
    return false;
  }

  const interactiveTarget = target.closest(
    'a, button, input, select, textarea, summary, [role="button"], [role="link"]',
  );

  return Boolean(interactiveTarget && interactiveTarget !== currentTarget);
}

function FeedModule({
  eagerMedia,
  item,
}: {
  eagerMedia: boolean;
  item: OverviewFeedViewItem;
}) {
  const moduleSize = getFeedModuleSize(item);
  const destination =
    item.destination.kind === "none" ? null : item.destination;

  const navigateToDestination = () => {
    if (!destination) {
      return;
    }

    if (destination.kind === "external") {
      window.open(destination.href, "_blank", "noopener,noreferrer");
      return;
    }

    window.location.assign(destination.href);
  };

  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    if (isInteractiveTarget(event.target, event.currentTarget)) {
      return;
    }

    navigateToDestination();
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (isInteractiveTarget(event.target, event.currentTarget)) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigateToDestination();
    }
  };

  const surface = (
    <Card
      aria-label={
        destination ? `Open ${item.metaLabel ?? item.type} item` : undefined
      }
      className={cn(
        "block gap-0 overflow-hidden border border-separator px-0 py-0 text-inherit no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        destination && "cursor-pointer",
      )}
      data-size={moduleSize}
      onClick={destination ? handleCardClick : undefined}
      onKeyDown={destination ? handleCardKeyDown : undefined}
      role={destination ? "link" : undefined}
      tabIndex={destination ? 0 : undefined}
    >
      <ModuleInner
        eagerMedia={eagerMedia}
        footerDestination={item.destination}
        item={item}
        moduleSize={moduleSize}
      />
    </Card>
  );

  return <article>{surface}</article>;
}

function buildTransitionStates(
  items: OverviewFeedViewItem[],
  state: TransitionState,
): Record<string, TransitionState> {
  return Object.fromEntries(items.map((item) => [item.id, state]));
}

function mergeItemsForExit(
  nextItems: OverviewFeedViewItem[],
  previousItems: OverviewFeedViewItem[],
) {
  const nextIds = new Set(nextItems.map((item) => item.id));
  const exitingItems = previousItems.filter((item) => !nextIds.has(item.id));

  return [...nextItems, ...exitingItems];
}

export function OverviewFeed({ initialFilter, items, pagination }: OverviewFeedProps) {
  const filter = useMemo(() => normalizeFilter(initialFilter), [initialFilter]);
  const filteredItems = useMemo(
    () => items.filter((item) => matchesFilter(item, filter)),
    [filter, items],
  );
  const eagerMediaIds = useMemo(
    () =>
      new Set(
        filteredItems
          .filter((item) => item.media.length > 0)
          .slice(0, getEagerMediaLimit(filter))
          .map((item) => item.id),
      ),
    [filter, filteredItems],
  );
  const [renderedItems, setRenderedItems] = useState(() => filteredItems);
  const [transitionStates, setTransitionStates] = useState<
    Record<string, TransitionState>
  >(() => buildTransitionStates(filteredItems, "active"));
  const previousItemsRef = useRef(filteredItems);
  const didMountRef = useRef(false);
  const transitionTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      previousItemsRef.current = filteredItems;
      setRenderedItems(filteredItems);
      setTransitionStates(buildTransitionStates(filteredItems, "active"));
      return;
    }

    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
    }

    const previousItems = previousItemsRef.current;
    const previousIds = new Set(previousItems.map((item) => item.id));
    const nextIds = new Set(filteredItems.map((item) => item.id));
    const states: Record<string, TransitionState> = {};

    for (const item of filteredItems) {
      states[item.id] = previousIds.has(item.id) ? "active" : "enter";
    }

    for (const item of previousItems) {
      if (!nextIds.has(item.id)) {
        states[item.id] = "exit";
      }
    }

    setRenderedItems(mergeItemsForExit(filteredItems, previousItems));
    setTransitionStates(states);
    previousItemsRef.current = filteredItems;

    transitionTimerRef.current = window.setTimeout(() => {
      setRenderedItems(filteredItems);
      setTransitionStates(buildTransitionStates(filteredItems, "active"));
    }, 220);

    return () => {
      if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
    };
  }, [filteredItems]);

  const activeFilterKey =
    filterLinks.find((link) => link.matches(filter))?.key ?? "all";

  return (
    <section
      aria-label="Overview feed"
      className="mx-auto w-full max-w-6xl px-5 pb-16"
      data-overview-feed
      id="overview"
    >
      <div className="mb-6 flex flex-nowrap items-center justify-start gap-4 overflow-x-auto sm:justify-end">
        <Tabs selectedKey={activeFilterKey}>
          <Tabs.ListContainer>
            <Tabs.List aria-label="Overview feed filters">
              {filterLinks.map((link) => {
                return (
                  <Tabs.Tab
                    href={link.href}
                    id={link.key}
                    key={link.key}
                    render={(domProps: unknown) => {
                      const linkProps = domProps as ComponentProps<
                        typeof NextLink
                      >;

                      return (
                        <NextLink
                          {...linkProps}
                          data-overview-filter-link
                          href={link.href}
                          prefetch={false}
                          scroll={false}
                        />
                      );
                    }}
                  >
                    {link.label}
                    <Tabs.Indicator />
                  </Tabs.Tab>
                );
              })}
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      </div>
      <div aria-live="polite" data-overview-feed-region>
        {renderedItems.length > 0 ? (
          <div data-overview-feed-reveal="ready">
            <div className={masonryStyles.paginatedGrid} data-feed-layout="css-masonry">
              {renderedItems.map((item) => (
                <div
                  className={masonryStyles.cell}
                  data-feed-transition={transitionStates[item.id]}
                  key={item.id}
                >
                  <FeedModule eagerMedia={eagerMediaIds.has(item.id)} item={item} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-separator p-8 text-muted">
            No feed items match this filter.
          </div>
        )}
      </div>
      {pagination && pagination.totalPages > 1 ? (
        <nav aria-label="Feed pagination" className="mt-6 flex items-center justify-between gap-4">
          {pagination.previousHref ? (
            <NextLink href={pagination.previousHref} prefetch={false} rel="prev" className="underline underline-offset-4">
              Previous
            </NextLink>
          ) : <span />}
          <span aria-current="page">Page {pagination.page} of {pagination.totalPages}</span>
          {pagination.nextHref ? (
            <NextLink href={pagination.nextHref} prefetch={false} rel="next" className="underline underline-offset-4">
              Next
            </NextLink>
          ) : <span />}
        </nav>
      ) : null}
    </section>
  );
}
