const DEFAULT_BASE_URL = process.env.SEO_PREVIEW_BASE_URL || "http://127.0.0.1:4321";

const ROUTES = [
  {
    path: "/",
    queryFamily: "site identity",
    routeClass: "home",
  },
  {
    path: "/blog",
    queryFamily: "engineering archive",
    routeClass: "collection",
  },
  {
    path: "/thoughts",
    queryFamily: "short engineering notes",
    routeClass: "collection",
  },
  {
    path: "/projects",
    queryFamily: "engineering projects",
    routeClass: "collection",
  },
  {
    path: "/stack",
    queryFamily: "engineering stack",
    routeClass: "collection",
  },
  {
    path: "/topics/astro-cloudflare-publishing",
    queryFamily: "astro cloudflare publishing migration",
    routeClass: "query-entry",
  },
];

function extractTag(html, pattern) {
  const matched = html.match(pattern);
  return matched ? matched[1].trim() : "";
}

function decodeHtml(value) {
  return value
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");
}

function extractMetaContent(html, attribute, value) {
  const patterns = [
    new RegExp(`<meta[^>]+${attribute}="${value}"[^>]+content="([^"]*)"`, "i"),
    new RegExp(`<meta[^>]+content="([^"]*)"[^>]+${attribute}="${value}"`, "i"),
  ];

  for (const pattern of patterns) {
    const matched = html.match(pattern);
    if (matched) {
      return decodeHtml(matched[1].trim());
    }
  }

  return "";
}

function extractCanonical(html) {
  const patterns = [
    /<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i,
    /<link[^>]+href="([^"]*)"[^>]+rel="canonical"/i,
  ];

  for (const pattern of patterns) {
    const matched = html.match(pattern);
    if (matched) {
      return decodeHtml(matched[1].trim());
    }
  }

  return "";
}

function isGenericTitle(value) {
  return [
    "Blog | sorcererxw'blog",
    "Thoughts | sorcererxw'blog",
    "Projects | sorcererxw'blog",
    "Stack | sorcererxw'blog",
  ].includes(value);
}

async function findArticlePath(baseUrl) {
  const response = await fetch(`${baseUrl}/blog`);
  const html = await response.text();
  const matched = html.match(/href="(\/articles\/[^"]+)"/);
  return matched ? matched[1] : null;
}

function isWeakCopy(entry) {
  if (!entry.title || !entry.description || !entry.canonical) {
    return true;
  }

  if (isGenericTitle(entry.title)) {
    return true;
  }

  if (entry.routeClass === "article") {
    return entry.description.length < 20;
  }

  return entry.description.length < 80;
}

async function inspectRoute(baseUrl, route) {
  const response = await fetch(`${baseUrl}${route.path}`);
  const html = await response.text();
  const title = decodeHtml(extractTag(html, /<title>([^<]+)<\/title>/i));
  const description = extractMetaContent(html, "name", "description");
  const canonical = extractCanonical(html);
  const robots = extractMetaContent(html, "name", "robots");

  return {
    ...route,
    canonical,
    description,
    robots,
    status: response.status,
    title,
    weakCopy: false,
  };
}

async function main() {
  const articlePath = await findArticlePath(DEFAULT_BASE_URL);
  const routes = articlePath
    ? [
        ...ROUTES,
        {
          path: articlePath,
          queryFamily: "article proof page",
          routeClass: "article",
        },
      ]
    : ROUTES;

  const entries = [];
  for (const route of routes) {
    entries.push(await inspectRoute(DEFAULT_BASE_URL, route));
  }

  const duplicates = new Map();
  for (const entry of entries) {
    duplicates.set(entry.title, (duplicates.get(entry.title) ?? 0) + 1);
  }

  const output = entries.map((entry) => {
    const withDuplicates = {
      ...entry,
      duplicateTitle: entry.title ? (duplicates.get(entry.title) ?? 0) > 1 : false,
    };

    return {
      ...withDuplicates,
      weakCopy: isWeakCopy(withDuplicates),
    };
  });

  console.table(
    output.map((entry) => ({
      canonical: entry.canonical,
      duplicateTitle: entry.duplicateTitle,
      path: entry.path,
      queryFamily: entry.queryFamily,
      robots: entry.robots,
      routeClass: entry.routeClass,
      status: entry.status,
      title: entry.title,
      weakCopy: entry.weakCopy,
    })),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
