import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect } from "react";

import { ArticleDetailView } from "@/components/article/article-detail-view";
import { PublicBoundary } from "@/components/shell/public-boundary";
import { trackTraks404 } from "@/lib/analytics/traks";
import { seoToHead, StructuredDataScripts } from "@/lib/seo-head";
import { loadArticlePageData } from "@/server-handlers/article-data";

const fetchArticlePageData = createServerFn({
  method: "GET",
  strict: false,
})
  .validator((data: { slug: string }) => data)
  .handler(async ({ data }) => loadArticlePageData(data.slug));

function ArticleNotFound() {
  useEffect(() => {
    trackTraks404();
  }, []);

  return (
    <div className="mx-auto flex justify-center">
      <PublicBoundary
        actions={[
          { href: "/", label: "Open homepage" },
          { href: "/?type=writing", label: "Open writing" },
        ]}
        message="The requested article is missing. Open the homepage or return to writing."
        title="Page not found."
      />
    </div>
  );
}

export const Route = createFileRoute("/articles/$slug")({
  loader: async ({ params }) => {
    const result = await fetchArticlePageData({ data: { slug: params.slug } });
    if (!result) {
      throw notFound();
    }
    return result;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        links: [
          {
            href: `https://sorcererxw.com/articles/${params.slug}`,
            rel: "canonical",
          },
          { href: "/favicon.svg", rel: "icon", type: "image/svg+xml" },
          { href: "/favicon.svg", rel: "shortcut icon", type: "image/svg+xml" },
        ],
        meta: [
          { title: "Page not found. | sorcererxw" },
          {
            content:
              "The requested article is missing. Open the homepage or return to writing.",
            name: "description",
          },
          { content: "noindex, follow", name: "robots" },
        ],
      };
    }

    return seoToHead(loaderData.seo);
  },
  headers: () => ({
    "Cache-Control": "public, max-age=0, s-maxage=600",
  }),
  component: ArticlePage,
  notFoundComponent: ArticleNotFound,
});

function ArticlePage() {
  const { article, seo } = Route.useLoaderData();

  return (
    <>
      <StructuredDataScripts seo={seo} />
      <ArticleDetailView article={article} />
    </>
  );
}
