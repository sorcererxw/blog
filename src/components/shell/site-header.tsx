import NextImage from "next/image";
import NextLink from "next/link";

import { cn } from "@/lib/utils";

import { getCurrentPublicRoute, getPublicRoutes } from "@/domains/shell/site-links";
import { ThemeToggle } from "@/components/shell/theme-toggle";

type SiteHeaderProps = {
  currentPath?: string | null;
};

export function SiteHeader({
  currentPath = null,
}: SiteHeaderProps) {
  const currentRoute = getCurrentPublicRoute(currentPath);
  const publicRoutes = getPublicRoutes(currentRoute);

  return (
    <header className="bg-[color:color-mix(in_oklab,var(--background)_94%,var(--surface)_6%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <NextLink
          className="inline-flex items-center gap-3 self-start text-current"
          href="/"
        >
          <NextImage
            alt="sorcererxw blog logo"
            className="h-10 w-auto flex-none"
            height="40"
            src="/favicon.svg"
            unoptimized
            width="37"
          />
          <span className="font-display text-2xl font-medium">
            sorcererxw
          </span>
        </NextLink>

        <div className="flex items-center gap-4 self-start sm:self-auto">
          {publicRoutes.length > 0 ? (
            <nav
              aria-label="Public routes"
              className="flex flex-wrap items-center gap-x-6 gap-y-2 sm:justify-end"
            >
              {publicRoutes.map((route) => (
                <NextLink
                  key={route.key}
                  aria-current={route.active ? "page" : undefined}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-foreground",
                    route.active
                      ? "text-foreground underline underline-offset-4"
                      : "text-muted",
                  )}
                  href={route.href}
                >
                  {route.label}
                </NextLink>
              ))}
            </nav>
          ) : null}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
