import NextLink from "next/link";

import { cn } from "@/lib/utils";
import { MasonryFeed } from "@/components/feed/masonry-feed";
import {
  HeroCard as Card,
  HeroCardContent as CardContent,
} from "@/components/heroui/server-primitives";

import type { ProjectListItem } from "@/domains/projects/types";

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

export function ProjectsList({items, className}: ProjectsListProps) {
  if (items.length === 0) {
    return (
        <section
        aria-label="Projects list empty state"
        className={cn(className)}
      >
        <Card className="mx-auto w-[min(100%-2rem,40rem)] py-16">
          <CardContent className="space-y-4 text-center">
            <p className="m-0 text-xs font-semibold uppercase tracking-widest text-muted">Projects</p>
            <h2 className="publication-home-title text-4xl">No projects published yet.</h2>
            <p className="publication-home-summary">
              The public projects index is ready. Entries will appear here as they land
              in Notion.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section aria-label="Projects list" className={cn("publication-project-list", className)}>
      <MasonryFeed
        calculateItemHeight={calculateProjectHeight}
        className="mt-0"
        getItemKey={(item) => `${item.title}-${item.url}`}
        items={items}
        renderItem={(item) => (
          <article className="h-full">
            <NextLink
              className="flex h-full flex-col text-inherit no-underline"
              href={item.url}
              rel="noreferrer"
              target="_blank"
            >
              <Card className="h-full rounded-xl border-[color:color-mix(in_oklab,var(--border)_82%,transparent_18%)] bg-[color:color-mix(in_oklab,var(--surface)_94%,white_6%)] py-0 shadow-[0_14px_32px_-28px_color-mix(in_oklab,var(--foreground)_25%,transparent)] transition-[border-color,color,transform] duration-150 hover:-translate-y-0.5 hover:border-[color:color-mix(in_oklab,var(--foreground)_12%,var(--border))] [&:hover_.project-card-cta]:text-foreground [&:hover_.project-card-title]:text-foreground">
                <div className="grid h-full gap-4 px-5 pb-4 pt-5">
                  <div className="flex items-start gap-3">
                    {item.emoji ? (
                      <span className="inline-flex h-6 min-w-6 items-center justify-center text-base leading-none text-muted">
                        {item.emoji}
                      </span>
                    ) : null}
                    <h3 className="project-card-title m-0 font-heading text-lg font-medium leading-tight tracking-tight">
                      {item.title}
                    </h3>
                  </div>
                  <p className="m-0 flex-1 text-base leading-relaxed text-muted">
                    {item.description}
                  </p>
                  <span className="project-card-cta mt-auto inline-flex text-sm font-semibold uppercase tracking-wide text-muted transition-colors">
                    Visit project ↗
                  </span>
                </div>
              </Card>
            </NextLink>
          </article>
        )}
      />
    </section>
  );
}
