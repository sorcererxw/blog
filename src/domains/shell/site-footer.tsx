import { getRuntimeConfig } from "@/config/runtime";

import { getFooterLinks } from "./site-links";

type SiteFooterProps = {
  includeStack?: boolean;
};

export function SiteFooter({ includeStack }: SiteFooterProps) {
  const effectiveIncludeStack = includeStack ?? !getRuntimeConfig().isProduction;
  const footerGroups = getFooterLinks({ includeStack: effectiveIncludeStack });

  return (
    <footer className="border-t border-[color:var(--border)] bg-[color:color-mix(in_oklab,var(--background)_94%,var(--card)_6%)]">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] sm:items-start sm:gap-12 sm:px-8">
        <div className="flex flex-col justify-end gap-3 text-[color:var(--muted-foreground)] sm:self-stretch">
          <p className="text-xs text-[color:var(--muted-foreground)]">© 2026 sorcererxw</p>
        </div>

        <nav
          aria-label="Footer site map"
          className="grid gap-6 text-sm sm:justify-self-end sm:grid-cols-2"
        >
          {footerGroups.map((group) => (
            <div key={group.title} className="grid content-start gap-3">
              {group.links.map((link) =>
                link.external ? (
                  <a
                    key={link.label}
                    className="font-medium text-[color:var(--muted-foreground)] transition-colors hover:text-[color:var(--foreground)]"
                    href={link.href}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {link.label}
                  </a>
                ) : (
                  <a
                    key={link.label}
                    className="font-medium text-[color:var(--muted-foreground)] transition-colors hover:text-[color:var(--foreground)]"
                    href={link.href}
                  >
                    {link.label}
                  </a>
                ),
              )}
            </div>
          ))}
        </nav>
      </div>
    </footer>
  );
}
