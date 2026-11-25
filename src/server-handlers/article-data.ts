import { getArticleBySlug } from "@/domains/article/get-article-by-slug";
import type { ArticleDetail } from "@/domains/article/article-detail-types";
import { buildSeo } from "@/domains/seo/build-seo";
import {
  buildBreadcrumbStructuredData,
  buildTechArticleStructuredData,
} from "@/domains/seo/build-structured-data";
import {
  createPublicProviderCache,
  withCachedArticleDetailSource,
} from "@/integrations/kv/provider-wrappers";
import { createNotionArticleDetailSource } from "@/integrations/notion/article-detail";

export function buildArticleSeo(article: ArticleDetail, pathname: string) {
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

export async function loadArticlePageData(slug: string) {
  const providerCache = await createPublicProviderCache();
  const article = await getArticleBySlug({
    slug,
    source: withCachedArticleDetailSource(
      createNotionArticleDetailSource(),
      providerCache,
    ),
  });

  if (!article) {
    return null;
  }

  return {
    article,
    seo: buildArticleSeo(article, `/articles/${slug}`),
  };
}
