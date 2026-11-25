import { Link, useRouter } from "@tanstack/react-router";
import type { AnchorHTMLAttributes, ReactNode } from "react";

export type SiteLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> & {
  children?: ReactNode;
  href: string;
  prefetch?: boolean;
};

const EXTERNAL_PROTOCOL_PATTERN = /^(?:[a-z][a-z\d+\-.]*:|\/\/)/i;

function isExternalOrHashHref(href: string) {
  return href.startsWith("#") || EXTERNAL_PROTOCOL_PATTERN.test(href);
}

function parseInternalHref(href: string) {
  const url = new URL(href, "https://site.local");
  const search: Record<string, string> = {};

  for (const [key, value] of url.searchParams.entries()) {
    search[key] = value;
  }

  return {
    hash: url.hash ? url.hash.slice(1) : undefined,
    pathname: url.pathname,
    search,
  };
}

export function SiteLink({
  children,
  href,
  prefetch,
  target,
  ...rest
}: SiteLinkProps) {
  const router = useRouter({ warn: false });

  if (!router || target === "_blank" || isExternalOrHashHref(href)) {
    return (
      <a {...rest} href={href} target={target}>
        {children}
      </a>
    );
  }

  const { hash, pathname, search } = parseInternalHref(href);

  return (
    <Link
      {...rest}
      activeProps={{}}
      hash={hash}
      preload={prefetch === false ? false : "intent"}
      search={search as never}
      target={target}
      to={pathname as never}
    >
      {children}
    </Link>
  );
}
