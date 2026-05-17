import NextImage from "next/image";
import NextLink from "next/link";

import { getRuntimeInfo } from "@/lib/cloudflare-env";
import { cn } from "@/lib/utils";

import { getCurrentPublicRoute, getPublicRoutes } from "./site-links";

type SiteHeaderProps = {
  currentPath?: string | null;
  includeStack?: boolean;
};

export function SiteHeader({
  currentPath = null,
  includeStack,
}: SiteHeaderProps) {
  const currentRoute = getCurrentPublicRoute(currentPath);
  const publicRoutes = getPublicRoutes(currentRoute, {
    includeStack: includeStack ?? !getRuntimeInfo().isProduction,
  });

  return (
    <header className="bg-[color:color-mix(in_oklab,var(--background)_94%,var(--card)_6%)]">
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
          <span className="font-serif text-2xl font-medium">
            sorcererxw
          </span>
        </NextLink>

        {publicRoutes.length > 0 ? (
          <nav aria-label="Public routes" className="flex flex-wrap items-center gap-x-6 gap-y-2 sm:justify-end">
            {publicRoutes.map((route) => (
              <NextLink
                key={route.key}
                aria-current={route.active ? "page" : undefined}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-foreground",
                  route.active ? "text-foreground underline underline-offset-4" : "text-muted-foreground",
                )}
                href={route.href}
              >
                {route.label}
              </NextLink>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
