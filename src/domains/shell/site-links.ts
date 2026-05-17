export type PublicRouteKey = "home" | "blog" | "thoughts" | "projects" | "stack";

type PublicRoute = {
  key: PublicRouteKey;
  label: string;
  href: string;
  active?: boolean;
};

export type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type FooterLinkGroup = {
  title: string;
  links: FooterLink[];
};

export function getCurrentPublicRoute(pathname: string | null): PublicRouteKey | null {
  if (!pathname) {
    return null;
  }

  if (/^\/articles(?:\/|$)/.test(pathname)) {
    return "blog";
  }

  if (/^\/thoughts(?:\/|$)/.test(pathname)) {
    return "thoughts";
  }

  if (/^\/projects(?:\/|$)/.test(pathname)) {
    return "projects";
  }

  if (/^\/stack(?:\/|$)/.test(pathname)) {
    return "stack";
  }

  if (pathname === "/") {
    return "home";
  }

  return null;
}

export function getPublicRoutes(
  currentRoute: PublicRouteKey | null = null,
  _options: { includeStack?: boolean } = {},
): PublicRoute[] {
  void currentRoute;
  return [];
}

export function getFooterLinks(
  _options: { includeStack?: boolean } = {},
): FooterLinkGroup[] {
  return [
    {
      title: "站外",
      links: [
        {
          label: "Jike",
          href: "https://jike.sorcererxw.com",
          external: true,
        },
        {
          label: "Github",
          href: "https://github.com/sorcererxw",
          external: true,
        },
        {
          label: "Telegram",
          href: "https://t.me/s/tech_bb",
          external: true,
        },
      ],
    },
  ];
}
