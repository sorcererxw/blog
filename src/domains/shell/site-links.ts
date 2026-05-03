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

  if (/^\/(blog|articles)(?:\/|$)/.test(pathname)) {
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
  options: { includeStack?: boolean } = {},
): PublicRoute[] {
  const routes: PublicRoute[] = [
    {
      key: "home",
      label: "Home",
      href: "/",
      active: currentRoute === "home",
    },
    {
      key: "blog",
      label: "Blog",
      href: "/blog",
      active: currentRoute === "blog",
    },
    {
      key: "thoughts",
      label: "Thoughts",
      href: "/thoughts",
      active: currentRoute === "thoughts",
    },
    {
      key: "projects",
      label: "Projects",
      href: "/projects",
      active: currentRoute === "projects",
    },
  ];

  if (options.includeStack ?? true) {
    routes.push({
      key: "stack",
      label: "Stack",
      href: "/stack",
      active: currentRoute === "stack",
    });
  }

  return routes;
}

export function getFooterLinks(
  options: { includeStack?: boolean } = {},
): FooterLinkGroup[] {
  const routeLinks: FooterLink[] = [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Blog",
      href: "/blog",
    },
    {
      label: "Thoughts",
      href: "/thoughts",
    },
    {
      label: "Projects",
      href: "/projects",
    },
  ];

  if (options.includeStack ?? true) {
    routeLinks.push({
      label: "Stack",
      href: "/stack",
    });
  }

  return [
    {
      title: "站内",
      links: routeLinks,
    },
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
