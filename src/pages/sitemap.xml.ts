import { ASTRO_CLOUDFLARE_WEDGE } from "@/domains/seo/query-wedge";
import { buildAbsoluteUrl } from "@/domains/seo/site";
import { listArticles } from "@/domains/article/list-articles";
import { articleListMemoryCache } from "@/integrations/kv/article-cache";
import { createBlogArticleSource } from "@/integrations/notion/articles";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const articles = await listArticles({
    source: createBlogArticleSource(),
    cache: articleListMemoryCache,
  });

  const urls = [
    buildAbsoluteUrl("/"),
    buildAbsoluteUrl("/blog"),
    buildAbsoluteUrl("/thoughts"),
    buildAbsoluteUrl("/projects"),
    buildAbsoluteUrl("/stack"),
    buildAbsoluteUrl(ASTRO_CLOUDFLARE_WEDGE.path),
    ...articles.map((item) => buildAbsoluteUrl(`/articles/${item.slug}`)),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url)}</loc>
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
