import { cn } from "@/lib/classnames";
import { buildCloudflareImageUrl } from "@/lib/images/cloudflare";
import { ResponsiveRemoteImage } from "@/components/media/responsive-remote-image";

import type { ArticleListItem } from "./types";
import styles from "./article-list.module.css";

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
    return <span className={styles.mark}>{item.icon.value}</span>;
  }

  if (item.icon?.kind === "url") {
    return (
      <span
        aria-label={`${item.title} icon`}
        className={styles.iconImage}
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
    <section aria-labelledby="blog-archive-title" className={cn(styles.archive, className)}>
      <h1 className="sr-only" id="blog-archive-title">
        Blog
      </h1>

      {items.length === 0 ? (
        <div className={styles.emptyState} aria-label="Article list empty state">
          <h2 className={styles.emptyTitle}>No articles published yet.</h2>
          <p className={styles.summary}>
            The archive is ready. As writing lands in Notion, published entries will
            appear here in reverse chronological order.
          </p>
        </div>
      ) : (
        <div className={styles.grid} aria-label="Article list">
          {items.map((item, index) => {
            const href = `/articles/${item.slug}`;
            const iconLabel = getIconLabel(item);

            return (
              <article
                key={item.slug}
                className={cn(styles.entry, index === 0 && styles.featured)}
              >
                <a className={styles.link} href={href}>
                  {item.cover ? (
                    <div className={cn(styles.coverWrap, index === 0 && styles.featuredCover)}>
                      <ResponsiveRemoteImage
                        alt=""
                        className={styles.cover}
                        preset="article-card"
                        src={item.cover}
                      />
                    </div>
                  ) : null}

                  <div className={styles.meta}>
                    <time className={styles.date} dateTime={item.date.toISOString()}>
                      {formatArticleDate(item.date)}
                    </time>

                    <div className={styles.heading}>
                      <h2 className={cn(styles.articleTitle, item.cover && styles.coveredTitle)}>
                        {item.title}
                      </h2>
                      {iconLabel ? <span className={styles.mark}>{iconLabel}</span> : null}
                      {!iconLabel ? <IconMark item={item} /> : null}
                    </div>
                  </div>

                  {item.summary ? <p className={styles.summaryText}>{item.summary}</p> : null}
                </a>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
