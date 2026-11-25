type RedirectTarget = {
  pathname: string;
  searchParams?: Record<string, string>;
};

const COMPATIBILITY_REDIRECTS: Record<string, RedirectTarget> = {
  "/projects": { pathname: "/", searchParams: { type: "projects" } },
  "/thoughts": { pathname: "/", searchParams: { type: "social" } },
};

function normalizePathname(pathname: string) {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function getRedirectTarget(pathname: string): RedirectTarget | null {
  const normalized = normalizePathname(pathname);
  const withoutLocale = normalized.replace(/^\/(?:en|zh)(?=\/|$)/, "") || "/";
  const compatibilityRedirect = COMPATIBILITY_REDIRECTS[withoutLocale];

  if (compatibilityRedirect) {
    return compatibilityRedirect;
  }

  if (withoutLocale !== normalized) {
    return { pathname: withoutLocale };
  }

  return null;
}

export function getLegacyRedirectDestination(pathname: string): string | null {
  const target = getRedirectTarget(pathname);

  if (!target) {
    return null;
  }

  const search = new URLSearchParams(target.searchParams ?? {});
  const query = search.toString();

  return query ? `${target.pathname}?${query}` : target.pathname;
}

export function getLegacyRedirectResponse(request: Request): Response | null {
  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return null;
  }

  const destination = getLegacyRedirectDestination(url.pathname);
  if (!destination) {
    return null;
  }

  return Response.redirect(new URL(destination, url), 308);
}
