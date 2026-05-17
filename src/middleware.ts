import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

function getRedirectDestination(pathname: string) {
  const target = getRedirectTarget(pathname);

  if (!target) {
    return null;
  }

  const search = new URLSearchParams(target.searchParams ?? {});
  const query = search.toString();

  return query ? `${target.pathname}?${query}` : target.pathname;
}

export function middleware(request: NextRequest) {
  const destination = getRedirectDestination(request.nextUrl.pathname);

  if (!destination) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL(destination, request.url), 308);
}
