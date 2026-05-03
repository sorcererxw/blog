import { buildAbsoluteUrl } from "./site";

import type { ArticleListItem } from "@/domains/article/types";
import type { ProjectListItem } from "@/domains/projects/types";
import type { StackListItem } from "@/domains/stack/types";
import type { ThoughtListItem } from "@/domains/thoughts/types";

export const ASTRO_CLOUDFLARE_WEDGE = {
  path: "/topics/astro-cloudflare-publishing",
  queryFamily: "astro cloudflare publishing migration",
  title: "Astro + Cloudflare publishing notes, migrations, and proof pages",
  description:
    "A focused map of Astro and Cloudflare publishing work, including migration notes, edge runtime choices, and the supporting articles, projects, stack entries, and thoughts behind them.",
  headline: "Astro + Cloudflare publishing, with proof pages",
  intro:
    "This page collects the public evidence behind how this site is built and migrated. It is meant for engineers evaluating Astro, Cloudflare, edge deployment, and content-publishing tradeoffs.",
} as const;

type QueryProof = {
  articles: ArticleListItem[];
  projects: ProjectListItem[];
  stack: StackListItem[];
  thoughts: ThoughtListItem[];
};

function containsKeyword(value: string, keywords: string[]) {
  const lower = value.toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword));
}

function toThoughtText(item: ThoughtListItem) {
  return [
    item.richText.map((segment) => segment.plainText).join(" "),
    item.webpage?.title ?? "",
    item.webpage?.description ?? "",
    item.webpage?.sitename ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

const WEDGE_KEYWORDS = ["astro", "cloudflare", "worker", "edge", "publishing", "migration"];

export function buildAstroCloudflareProof(options: {
  articles: ArticleListItem[];
  projects: ProjectListItem[];
  stack: StackListItem[];
  thoughts: ThoughtListItem[];
}): QueryProof {
  return {
    articles: options.articles.filter((item) =>
      containsKeyword(`${item.title} ${item.summary}`, WEDGE_KEYWORDS),
    ),
    projects: options.projects.filter((item) =>
      containsKeyword(`${item.title} ${item.description}`, WEDGE_KEYWORDS),
    ),
    stack: options.stack.filter((item) =>
      containsKeyword(
        `${item.name} ${item.description} ${item.platforms.join(" ")} ${item.tags.join(" ")}`,
        WEDGE_KEYWORDS,
      ),
    ),
    thoughts: options.thoughts
      .filter((item) => containsKeyword(toThoughtText(item), WEDGE_KEYWORDS))
      .slice(0, 3),
  };
}

export function getAstroCloudflareProofLinks(proof: QueryProof) {
  return [
    ...proof.articles.map((item) => ({
      name: item.title,
      url: buildAbsoluteUrl(`/articles/${item.slug}`),
    })),
    ...proof.projects.map((item) => ({
      name: item.title,
      url: item.url,
    })),
    ...proof.stack.map((item) => ({
      name: item.name,
      url: item.link,
    })),
    ...proof.thoughts.map((item) => ({
      name: item.webpage?.title || item.richText.map((segment) => segment.plainText).join(" ").slice(0, 80),
      url: buildAbsoluteUrl(`/thoughts#1_${item.id}`),
    })),
  ];
}
