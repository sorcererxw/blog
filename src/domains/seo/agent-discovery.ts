export const SITE_ORIGIN = "https://sorcererxw.com";

export const API_CATALOG_PATH = "/.well-known/api-catalog";

export const AGENT_DISCOVERY_LINKS = [
  `<${API_CATALOG_PATH}>; rel="api-catalog"; type="application/linkset+json"`,
  '</llms.txt>; rel="service-doc"; type="text/plain"',
  '</sitemap.xml>; rel="describedby"; type="application/xml"',
] as const;

export const AGENT_DISCOVERY_LINK_HEADER = AGENT_DISCOVERY_LINKS.join(", ");

export function absoluteSiteUrl(pathname: string): string {
  return new URL(pathname, SITE_ORIGIN).toString();
}
