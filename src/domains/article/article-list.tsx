import NextLink from "next/link";

import { cn } from "@/lib/utils";
import { buildCloudflareImageUrl } from "@/lib/images/cloudflare";
import { ResponsiveRemoteImage } from "@/components/media/responsive-remote-image";

import type { ArticleListItem } from "./types";

type ArticleListProps = {
  items: ArticleListItem[];
  className?: string;
};

export function formatArticleDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

function getIconLabel(item: ArticleListItem) {
  if (item.icon?.kind === "emoji") {
    return item.icon.value;
  }

  return null;
}

function IconMark({ item }: { item: ArticleListItem }) {
  if (item.icon?.kind === "emoji") {
    return (
      <span className="inline-flex h-6 min-w-6 flex-none items-center justify-center text-base leading-none text-muted-foreground">
        {item.icon.value}
      </span>
    );
  }

  if (item.icon?.kind === "url") {
    return (
      <span
        aria-label={`${item.title} icon`}
        className="h-7 w-7 flex-none rounded-full border border-border bg-card bg-cover bg-center bg-no-repeat"
        role="img"
        style={{
          backgroundImage: `url(${buildCloudflareImageUrl(item.icon.value, "icon")})`,
        }}
      />
    );
  }

  return null;
}

export function ArticleList({ items, className }: ArticleListProps) {
  return (
    <section
      aria-labelledby="blog-archive-title"
      className={cn("mx-auto grid w-[min(100%_-_2.5rem,64rem)] gap-9 max-sm:w-[min(100%_-_2rem,64rem)]", className)}
    >
      <h1 className="sr-only" id="blog-archive-title">
        Blog
      </h1>

      {items.length === 0 ? (
        <div className="grid w-full max-w-[38rem] gap-3 pt-2" aria-label="Article list empty state">
          <h2 className="m-0 font-serif text-3xl font-medium leading-none tracking-tighter md:text-4xl">
            No articles published yet.
          </h2>
          <p className="m-0 max-w-[38rem] text-base leading-7 text-muted-foreground">
            The archive is ready. As writing lands in Notion, published entries will
            appear here in reverse chronological order.
          </p>
        </div>
      ) : (
        <div className="grid items-start gap-10 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-9" aria-label="Article list">
          {items.map((item, index) => {
            const href = `/articles/${item.slug}`;
            const iconLabel = getIconLabel(item);

            return (
              <article
                key={item.slug}
                className={cn("min-w-0", index === 0 && "sm:col-span-2")}
              >
                <NextLink
                  className={cn(
                    "grid gap-4 text-inherit no-underline transition-[opacity,transform] duration-150 hover:-translate-y-0.5",
                    index === 0 && "sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] sm:items-start",
                  )}
                  href={href}
                >
                  {item.cover ? (
                    <div
                      className={cn(
                        "relative h-72 w-full overflow-hidden rounded-2xl bg-muted",
                        index === 0 && "h-[22rem] sm:row-span-3 sm:h-full sm:min-h-[22rem]",
                      )}
                    >
                      <ResponsiveRemoteImage
                        alt=""
                        className="block h-full w-full object-cover"
                        preset="article-card"
                        src={item.cover}
                      />
                    </div>
                  ) : null}

                  <div className="grid gap-2.5">
                    <time
                      className="text-xs uppercase leading-normal tracking-widest text-muted-foreground"
                      dateTime={item.date.toISOString()}
                    >
                      {formatArticleDate(item.date)}
                    </time>

                    <div className="flex min-w-0 items-start justify-between gap-4">
                      <h2
                        className={cn(
                          "m-0 text-pretty font-serif text-2xl font-medium leading-none tracking-tighter md:text-3xl",
                          item.cover && "text-3xl md:text-4xl",
                        )}
                      >
                        {item.title}
                      </h2>
                      {iconLabel ? (
                        <span className="inline-flex h-6 min-w-6 flex-none items-center justify-center text-base leading-none text-muted-foreground">
                          {iconLabel}
                        </span>
                      ) : null}
                      {!iconLabel ? <IconMark item={item} /> : null}
                    </div>
                  </div>

                  {item.summary ? (
                    <p className="m-0 max-w-[44rem] text-base leading-7 text-muted-foreground">
                      {item.summary}
                    </p>
                  ) : null}
                </NextLink>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
