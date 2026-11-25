import {
  AGENT_DISCOVERY_LINK_HEADER,
  absoluteSiteUrl,
} from "@/domains/seo/agent-discovery";

const API_CATALOG_CONTENT_TYPE =
  'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"';

const API_CATALOG_HEADERS = {
  "Cache-Control": "public, max-age=0, s-maxage=600",
  "Content-Type": API_CATALOG_CONTENT_TYPE,
  Link: AGENT_DISCOVERY_LINK_HEADER,
};

function buildApiCatalog() {
  return {
    linkset: [
      {
        anchor: absoluteSiteUrl("/.well-known/api-catalog"),
        describedby: [
          {
            href: absoluteSiteUrl("/sitemap.xml"),
            title: "Canonical public URL sitemap",
            type: "application/xml",
          },
        ],
        item: [
          {
            href: absoluteSiteUrl("/api/health"),
            title: "Public health check endpoint",
            type: "application/json",
          },
        ],
        "service-doc": [
          {
            href: absoluteSiteUrl("/llms.txt"),
            title: "AI-readable site guide",
            type: "text/plain",
          },
        ],
      },
    ],
  };
}

export async function handleApiCatalogGet() {
  return Response.json(buildApiCatalog(), {
    headers: API_CATALOG_HEADERS,
  });
}

export async function handleApiCatalogHead() {
  return new Response(null, {
    headers: API_CATALOG_HEADERS,
  });
}
