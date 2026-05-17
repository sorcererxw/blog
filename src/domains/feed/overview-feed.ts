import type { ArticleListItem } from "@/domains/article/types";
import type { ProjectListItem } from "@/domains/projects/types";
import type { ThoughtListItem } from "@/domains/thoughts/types";

import type {
  FeedFilter,
  FeedItem,
  FeedItemType,
  FeedMediaPreview,
  ModuleSize,
} from "./types";

type ModuleSizeInput = ModuleSize | string | null | undefined;

type FeedSourceInput = {
  articles: ArticleListItem[];
  projects: ProjectListItem[];
  thoughts: ThoughtListItem[];
};

const validModuleSizes = new Set<ModuleSize>(["compact", "standard", "feature"]);
const validFeedTypes = new Set<FeedItemType>(["writing", "projects", "social"]);

export const normalizeModuleSize = (
  value: ModuleSizeInput,
  fallback: ModuleSize,
): ModuleSize => {
  if (value && validModuleSizes.has(value as ModuleSize)) {
    return value as ModuleSize;
  }

  return fallback;
};

const hasSubstantialMedia = (thought: ThoughtListItem) =>
  thought.photos.length > 0 || thought.webpage?.photo != null;

const toSortTime = (item: FeedItem) =>
  item.displayedAt?.getTime() ?? item.sourcePublishedAt?.getTime() ?? null;

export const sortFeedItems = (items: FeedItem[]): FeedItem[] =>
  [...items].sort((left, right) => {
    const leftTime = toSortTime(left);
    const rightTime = toSortTime(right);

    if (leftTime === null && rightTime === null) {
      return left.title.localeCompare(right.title);
    }

    if (leftTime === null) {
      return 1;
    }

    if (rightTime === null) {
      return -1;
    }

    return rightTime - leftTime;
  });

export const articleToFeedItem = (article: ArticleListItem): FeedItem => ({
  id: `article:${article.slug}`,
  type: "writing",
  source: "notion",
  title: article.title,
  summary: article.summary,
  titleEmoji: article.icon?.kind === "emoji" ? article.icon.value : null,
  displayedAt: article.displayedAt ?? article.date,
  sourcePublishedAt: article.date,
  moduleSize: normalizeModuleSize(article.moduleSize, "standard"),
  destination: {
    kind: "internal",
    href: `/articles/${article.slug}`,
  },
  media: article.cover
    ? [
        {
          alt: "",
          src: article.cover,
        },
      ]
    : [],
  metaLabel: "Writing",
});

export const projectToFeedItem = (project: ProjectListItem): FeedItem => {
  const displayedAt = project.displayedAt ?? project.period ?? null;
  const destination = project.url
    ? ({
        kind: "external",
        href: project.url,
      } as const)
    : ({
        kind: "none",
      } as const);

  return {
    id: `project:${project.url || project.title}`,
    type: "projects",
    source: "notion",
    title: project.title,
    summary: project.description,
    titleEmoji: project.emoji,
    displayedAt,
    sourcePublishedAt: project.period ?? null,
    moduleSize: normalizeModuleSize(project.moduleSize, "standard"),
    destination,
    media: [],
    metaLabel: "Project",
  };
};

const thoughtSummary = (thought: ThoughtListItem) => {
  const text = thought.richText
    .map((segment) => segment.plainText)
    .join("")
    .replace(/\s+/g, " ")
    .trim();

  return text || thought.webpage?.description || thought.webpage?.title || "Telegram post";
};

const thoughtTitle = (thought: ThoughtListItem) => {
  const summary = thoughtSummary(thought);

  return thought.webpage?.title || summary.slice(0, 90) || "Telegram post";
};

const thoughtMedia = (thought: ThoughtListItem): FeedMediaPreview[] => {
  const seen = new Set<string>();
  const photos = [...thought.photos];

  if (thought.webpage?.photo) {
    photos.push(thought.webpage.photo);
  }

  return photos.flatMap((photo) => {
    const src = photo.originalUrl ?? photo.thumbnailUrl ?? null;

    if (!src || seen.has(src)) {
      return [];
    }

    seen.add(src);

    return [
      {
        alt: "",
        height: photo.height ?? null,
        src,
        width: photo.width ?? null,
      },
    ];
  });
};

export const thoughtToFeedItem = (thought: ThoughtListItem): FeedItem => ({
  id: `social:telegram:${thought.id}`,
  type: "social",
  source: "telegram",
  title: thoughtTitle(thought),
  summary: thoughtSummary(thought),
  summaryRichText: thought.richText,
  displayedAt: thought.displayedAt ?? thought.date,
  sourcePublishedAt: thought.date,
  moduleSize: normalizeModuleSize(
    thought.moduleSize,
    hasSubstantialMedia(thought) ? "standard" : "compact",
  ),
  destination: {
    kind: "external",
    href: thought.link,
  },
  media: thoughtMedia(thought),
  metaLabel: "Telegram",
});

export const buildOverviewFeedIndex = ({
  articles,
  projects,
  thoughts,
}: FeedSourceInput): FeedItem[] =>
  sortFeedItems([
    ...articles.map(articleToFeedItem),
    ...projects.map(projectToFeedItem),
    ...thoughts.map(thoughtToFeedItem),
  ]);

export const parseFeedFilter = (url: URL): FeedFilter => {
  const type = url.searchParams.get("type");
  const source = url.searchParams.get("source");

  return {
    source: source || null,
    type: type && validFeedTypes.has(type as FeedItemType) ? (type as FeedItemType) : null,
  };
};

export const applyFeedFilter = (items: FeedItem[], filter: FeedFilter): FeedItem[] =>
  items.filter((item) => {
    if (filter.type && item.type !== filter.type) {
      return false;
    }

    if (filter.source && item.source !== filter.source) {
      return false;
    }

    return true;
  });
