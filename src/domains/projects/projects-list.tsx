import { cn } from "@/lib/classnames";
import { Card } from "@/components/ui/card";
import { Empty, EmptyContent } from "@/components/ui/empty";
import { MasonryFeed } from "@/domains/feed/masonry-feed";

import type { ProjectListItem } from "./types";
import styles from "./projects-list.module.css";

type ProjectsListProps = {
  items: ProjectListItem[];
  className?: string;
};

function calculateProjectHeight(item: ProjectListItem, columns: number) {
  if (columns === 1) {
    return item.description.length + 36;
  }

  if (columns === 2) {
    return item.description.length / 60 + 36;
  }

  return item.description.length / 40 + 36;
}

export function ProjectsList({ items, className }: ProjectsListProps) {
  if (items.length === 0) {
    return (
      <section
        aria-label="Projects list empty state"
        className={cn(className)}
      >
        <Empty className={cn(styles.emptyState, "space-y-4")}>
          <EmptyContent>
            <p className="shell-eyebrow">Projects</p>
            <h2 className="publication-home-title text-4xl">No projects published yet.</h2>
            <p className="publication-home-summary">
              The public projects index is ready. Entries will appear here as they land
              in Notion.
            </p>
          </EmptyContent>
        </Empty>
      </section>
    );
  }

  return (
    <section aria-label="Projects list" className={cn("publication-project-list", className)}>
      <MasonryFeed
        calculateItemHeight={calculateProjectHeight}
        className={styles.feed}
        getItemKey={(item) => `${item.title}-${item.url}`}
        items={items}
        renderItem={(item) => (
          <article className={styles.entry}>
            <a className={styles.link} href={item.url} rel="noreferrer" target="_blank">
              <Card className={cn(styles.card, "h-full py-0")}>
                <div className={styles.inner}>
                  <div className={styles.head}>
                    {item.emoji ? (
                      <span className={styles.mark}>{item.emoji}</span>
                    ) : null}
                    <h3 className={styles.title}>{item.title}</h3>
                  </div>
                  <p className={styles.summary}>{item.description}</p>
                  <span className={styles.cta}>Visit project ↗</span>
                </div>
              </Card>
            </a>
          </article>
        )}
      />
    </section>
  );
}
