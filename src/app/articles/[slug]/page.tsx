import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleDetailView } from "@/domains/article/article-detail-view";
import { getArticleBySlug } from "@/domains/article/get-article-by-slug";
import {
  buildBreadcrumbStructuredData,
  buildTechArticleStructuredData,
} from "@/domains/seo/build-structured-data";
import { buildSeo } from "@/domains/seo/build-seo";
import { articleDetailMemoryCache } from "@/integrations/kv/article-detail-cache";
import { createNotionArticleDetailSource } from "@/integrations/notion/article-detail";

import { seoToMetadata, StructuredDataScripts } from "../../seo";

export const revalidate = 600;

type ArticleParams = Promise<{ slug: string }>;

async function loadArticle(slug: string) {
  return getArticleBySlug({
    source: createNotionArticleDetailSource(),
    cache: articleDetailMemoryCache,
    slug,
  });
}

function buildArticleSeo(article: NonNullable<Awaited<ReturnType<typeof loadArticle>>>, pathname: string) {
  const image = article.cover
    ? {
        alt: article.title,
        url: article.cover,
      }
    : article.icon?.kind === "url"
      ? {
          alt: `${article.title} icon`,
          url: article.icon.value,
        }
      : null;

  return buildSeo({
    description: article.summary,
    image,
    kind: "article",
    pathname,
    publishedTime: article.date.toISOString(),
    structuredData: [
      buildTechArticleStructuredData({
        description: article.summary,
        image,
        pathname,
        publishedTime: article.date.toISOString(),
        title: article.title,
      }),
      buildBreadcrumbStructuredData([
        { name: "Home", path: "/" },
        { name: "Writing", path: "/?type=writing" },
        { name: article.title, path: pathname },
      ]),
    ],
    title: article.title,
  });
}

export async function generateMetadata({
  params,
}: {
  params: ArticleParams;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await loadArticle(slug);

  if (!article) {
    return seoToMetadata(
      buildSeo({
        description: "The requested article is missing. Open the homepage or return to writing.",
        indexable: false,
        kind: "boundary",
        pathname: `/articles/${slug}`,
        title: "Page not found.",
      }),
    );
  }

  return seoToMetadata(buildArticleSeo(article, `/articles/${slug}`));
}

export default async function ArticlePage({ params }: { params: ArticleParams }) {
  const { slug } = await params;
  const article = await loadArticle(slug);

  if (!article) {
    notFound();
  }

  const seo = buildArticleSeo(article, `/articles/${slug}`);

  return (
    <>
      <StructuredDataScripts seo={seo} />
      <ArticleDetailView article={article} />
    </>
  );
}
