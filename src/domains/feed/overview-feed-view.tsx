"use client";

import NextLink from "next/link";
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ResponsiveRemoteImage } from "@/components/media/responsive-remote-image";
import { assignFeedLayout, getFeedModuleSize } from "@/domains/feed/feed-layout-engine";
import { cn } from "@/lib/utils";

import masonryStyles from "./masonry-feed.module.css";
import type {
  FeedDestination,
  FeedFilter,
  FeedItemType,
  FeedMediaPreview,
  FeedRichTextSegment,
  ModuleSize,
  PresentationIntent,
} from "./types";

export type OverviewFeedViewItem = {
  destination: FeedDestination;
  displayedAt: string | null;
  id: string;
  media: FeedMediaPreview[];
  metaLabel?: string | null;
  presentationIntent?: PresentationIntent | null;
  source: string;
  sourcePublishedAt: string | null;
  summary: string;
  summaryRichText?: FeedRichTextSegment[];
  title: string;
  titleEmoji?: string | null;
  type: FeedItemType;
};

type OverviewFeedProps = {
  initialFilter: FeedFilter;
  items: OverviewFeedViewItem[];
};

type TransitionState = "active" | "enter" | "exit";

const filterLinks = [
  { href: "/", key: "all", label: "All", matches: (filter: FeedFilter) => !filter.type && !filter.source },
  { href: "/?type=writing", key: "writing", label: "Writing", matches: (filter: FeedFilter) => filter.type === "writing" },
  { href: "/?type=projects", key: "projects", label: "Projects", matches: (filter: FeedFilter) => filter.type === "projects" },
  { href: "/?source=telegram", key: "telegram", label: "Telegram", matches: (filter: FeedFilter) => filter.source === "telegram" },
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

function parseFilterFromLocation() {
  const searchParams = new URLSearchParams(window.location.search);
  const type = searchParams.get("type");

  return normalizeFilter({
    source: searchParams.get("source"),
    type: type === "writing" || type === "projects" || type === "social" ? type : null,
  });
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

function renderRichTextSegment(segment: FeedRichTextSegment, index: number): ReactNode {
  if (!segment.plainText) {
    return null;
  }

  let content: ReactNode = segment.plainText;

  if (segment.url) {
    content = (
      <NextLink
        className="font-semibold text-foreground underline underline-offset-[0.12em]"
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
      <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm">
        {content}
      </code>
    );
  }

  if (segment.strike) {
    content = <s>{content}</s>;
  }

  if (segment.quote) {
    return (
      <blockquote className="my-2 border-l-2 border-border pl-3 text-foreground" key={index}>
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

function hasInlineLinks(item: OverviewFeedViewItem) {
  return item.summaryRichText?.some((segment) => segment.url) ?? false;
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
      <div className="aspect-[16/10] overflow-hidden bg-muted">
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
    <div className="grid grid-cols-2 gap-px overflow-hidden bg-muted">
      {item.media.map((media, index) => (
        <div
          className={cn(
            "aspect-square overflow-hidden bg-muted",
            item.media.length % 2 === 1 && index === 0 && "col-span-2 aspect-[16/10]",
          )}
          key={`${media.src}-${index}`}
        >
          <ResponsiveRemoteImage
            alt={media.alt}
            className="h-full w-full object-cover"
            fetchPriority={eager && index === 0 ? "high" : undefined}
            height={media.height ?? 720}
            preset={item.source === "telegram" ? "thought-photo" : "article-card"}
            loading={eager && index === 0 ? "eager" : "lazy"}
            src={media.src}
            width={media.width ?? 1280}
          />
        </div>
      ))}
    </div>
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
        className={cn(
          "grid gap-3 p-5",
          moduleSize === "compact" && "gap-2 p-4",
          moduleSize === "feature" && "p-6",
        )}
      >
        <div className="justify-self-start">
          <Badge variant="secondary">
            {item.metaLabel ?? item.type}
          </Badge>
        </div>
        {isTelegram ? null : (
          <h2
            className={cn(
              "m-0 flex items-baseline gap-2 font-serif text-2xl font-semibold leading-tight tracking-normal text-foreground",
              moduleSize === "compact" && "text-lg",
              moduleSize === "feature" && "text-3xl",
            )}
          >
            {item.titleEmoji ? (
              <span aria-hidden="true" className="shrink-0 font-sans">
                {item.titleEmoji}
              </span>
            ) : null}
            <span>{item.title}</span>
          </h2>
        )}
        <FeedText item={item} />
        {footerDestination && footerDestination.kind !== "none" ? (
          <NextLink
            className="justify-self-start no-underline hover:[&_time]:text-foreground"
            href={footerDestination.href}
            rel={footerDestination.kind === "external" ? "noreferrer" : undefined}
            target={footerDestination.kind === "external" ? "_blank" : undefined}
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

function FeedModule({
  eagerMedia,
  item,
}: {
  eagerMedia: boolean;
  item: OverviewFeedViewItem;
}) {
  const moduleSize = getFeedModuleSize(item);
  const shouldUseOuterLink = item.destination.kind !== "none" && !hasInlineLinks(item);
  const surface = (
    <Card
      className="block gap-0 overflow-hidden border border-border py-0 text-inherit no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      data-size={moduleSize}
    >
      <ModuleInner
        eagerMedia={eagerMedia}
        footerDestination={shouldUseOuterLink ? null : item.destination}
        item={item}
        moduleSize={moduleSize}
      />
    </Card>
  );

  if (!shouldUseOuterLink || item.destination.kind === "none") {
    return (
      <article>
        {surface}
      </article>
    );
  }

  const destination = item.destination;

  return (
    <NextLink
      className="block text-inherit no-underline"
      href={destination.href}
      rel={destination.kind === "external" ? "noreferrer" : undefined}
      target={destination.kind === "external" ? "_blank" : undefined}
    >
      {surface}
    </NextLink>
  );
}

function getColumnCount(width: number) {
  if (width >= 1024) {
    return 3;
  }

  if (width >= 640) {
    return 2;
  }

  return 1;
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

export function OverviewFeed({ initialFilter, items }: OverviewFeedProps) {
  const [filter, setFilter] = useState<FeedFilter>(() => normalizeFilter(initialFilter));
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
  const [transitionStates, setTransitionStates] = useState<Record<string, TransitionState>>(() =>
    buildTransitionStates(filteredItems, "active"),
  );
  const previousItemsRef = useRef(filteredItems);
  const feedRegionRef = useRef<HTMLDivElement | null>(null);
  const didMountRef = useRef(false);
  const transitionTimerRef = useRef<number | null>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      setFilter(parseFilterFromLocation());
    };

    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const node = feedRegionRef.current;

    if (!node) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const [entry] = entries;

      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(node);
    setContainerWidth(node.getBoundingClientRect().width);

    return () => observer.disconnect();
  }, []);

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
  }, [filteredItems]);

  const handleFilterClick = (href: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const url = new URL(href, window.location.origin);

    window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
    setFilter(parseFilterFromLocation());
  };
  const columnCount = containerWidth ? getColumnCount(containerWidth) : 1;
  const hydratedLayout = useMemo(
    () =>
      containerWidth && columnCount > 1
        ? assignFeedLayout(renderedItems, {
            columnCount,
            containerWidth,
            gap: 8,
          })
        : null,
    [columnCount, containerWidth, renderedItems],
  );
  const isFeedLayoutReady = containerWidth !== null && (columnCount === 1 || hydratedLayout !== null);

  return (
    <section
      aria-label="Overview feed"
      className="mx-auto w-full max-w-6xl px-5 pb-16"
      data-overview-feed
      id="overview"
    >
      <div className="mb-6 flex flex-nowrap items-center justify-start gap-4 overflow-x-auto sm:justify-end">
        <div data-orientation="horizontal" data-slot="tabs" className="flex max-w-full gap-2">
          <div
            aria-label="Overview feed filters"
            className="inline-flex w-auto flex-row flex-nowrap items-center gap-0 rounded-full border border-border bg-transparent p-1"
            data-orientation="horizontal"
            data-slot="tabs-list"
            role="tablist"
          >
            {filterLinks.map((link) => {
              const isActive = link.matches(filter);

              return (
                <NextLink
                  aria-selected={isActive}
                  className={cn(
                    "inline-flex w-auto min-w-0 flex-none items-center justify-center rounded-full px-3 py-1.5 text-sm font-medium text-foreground no-underline transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    isActive && "bg-foreground text-background hover:text-background",
                  )}
                  data-active={isActive}
                  data-overview-filter-link
                  data-slot="tabs-trigger"
                  href={link.href}
                  key={link.key}
                  onClick={handleFilterClick(link.href)}
                  role="tab"
                >
                  {link.label}
                </NextLink>
              );
            })}
          </div>
        </div>
      </div>
      <div aria-live="polite" data-overview-feed-region ref={feedRegionRef}>
        <noscript>
          <style>{`[data-overview-feed-reveal="pending"]{opacity:1!important}`}</style>
        </noscript>
        {renderedItems.length > 0 ? (
          <div
            className={cn(
              "transition-opacity duration-300 ease-out",
              isFeedLayoutReady ? "opacity-100" : "opacity-0",
            )}
            data-overview-feed-reveal={isFeedLayoutReady ? "ready" : "pending"}
          >
            {hydratedLayout ? (
              <div
                className="mt-4 grid gap-2"
                data-feed-layout="hydrated-masonry"
                style={{
                  gridTemplateColumns: `repeat(${hydratedLayout.columns.length}, minmax(0, 1fr))`,
                }}
              >
                {hydratedLayout.columns.map((column, columnIndex) => (
                  <div className="flex flex-col gap-2" key={columnIndex}>
                    {column.items.map(({ item }) => (
                      <div
                        className={masonryStyles.cell}
                        data-feed-transition={transitionStates[item.id]}
                        key={item.id}
                      >
                        <FeedModule eagerMedia={eagerMediaIds.has(item.id)} item={item} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-2" data-feed-layout="fallback-single-column">
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
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-8 text-muted-foreground">
            No feed items match this filter.
          </div>
        )}
      </div>
    </section>
  );
}
