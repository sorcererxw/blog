import { getRuntimeConfig } from "@/config/runtime";

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
    includeStack: includeStack ?? !getRuntimeConfig().isProduction,
  });

  return (
    <header className="border-b border-[color:var(--border)] bg-[color:color-mix(in_oklab,var(--background)_94%,var(--card)_6%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <a
          className="inline-flex items-center gap-3 self-start text-current"
          href="/"
        >
          <img
            alt="sorcererxw blog logo"
            className="h-10 w-auto flex-none"
            height="40"
            src="/favicon.svg"
            width="37"
          />
          <span className="[font-family:var(--font-serif)] text-[1.55rem] font-medium tracking-[-0.03em]">
            sorcererxw&apos;s blog
          </span>
        </a>

        <nav aria-label="Public routes" className="flex flex-wrap items-center gap-x-6 gap-y-2 sm:justify-end">
          {publicRoutes.map((route) => (
            <a
              key={route.key}
              aria-current={route.active ? "page" : undefined}
              className={`text-sm font-medium transition-colors hover:text-[color:var(--foreground)] ${
                route.active ? "text-[color:var(--foreground)] underline underline-offset-4" : "text-[color:var(--muted-foreground)]"
              }`}
              href={route.href}
            >
              {route.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
