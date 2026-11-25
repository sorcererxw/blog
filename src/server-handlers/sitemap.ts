import { listArticles } from "@/domains/article/list-articles";
import { buildAbsoluteUrl } from "@/domains/seo/site";
import {
  createPublicProviderCache,
  withCachedArticleSource,
} from "@/integrations/kv/provider-wrappers";
import { createBlogArticleSource } from "@/integrations/notion/articles";

type SitemapUrl = {
  lastmod?: string;
  loc: string;
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function handleSitemapRequest() {
  const providerCache = await createPublicProviderCache();
  const articles = await listArticles({
    source: withCachedArticleSource(createBlogArticleSource(), providerCache),
  });

  const urls: SitemapUrl[] = [
    { loc: buildAbsoluteUrl("/") },
    ...articles.map((item) => ({
      lastmod: item.date.toISOString(),
      loc: buildAbsoluteUrl(`/articles/${item.slug}`),
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>${
      url.lastmod
        ? `
    <lastmod>${escapeXml(url.lastmod)}</lastmod>`
        : ""
    }
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=600",
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
