import NextLink from "next/link";

import { getFooterLinks } from "@/domains/shell/site-links";

export function SiteFooter() {
  const footerGroups = getFooterLinks();

  return (
    <footer className="bg-[color:color-mix(in_oklab,var(--background)_94%,var(--surface)_6%)]">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] sm:items-start sm:gap-12 sm:px-8">
        <div className="flex flex-col justify-end gap-3 text-muted sm:self-stretch">
          <p className="text-xs text-muted">© 2026 sorcererxw</p>
        </div>

        <nav
          aria-label="Footer site map"
          className="grid gap-6 text-sm sm:justify-self-end"
        >
          {footerGroups.map((group) => (
            <div key={group.title} className="grid content-start gap-3">
              {group.links.map((link) =>
                link.external ? (
                  <NextLink
                    key={link.label}
                    className="font-medium text-muted transition-colors hover:text-foreground"
                    href={link.href}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {link.label}
                  </NextLink>
                ) : (
                  <NextLink
                    key={link.label}
                    className="font-medium text-muted transition-colors hover:text-foreground"
                    href={link.href}
                  >
                    {link.label}
                  </NextLink>
                ),
              )}
            </div>
          ))}
        </nav>
      </div>
    </footer>
  );
}
