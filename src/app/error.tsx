"use client";

import NextLink from "next/link";

export default function ErrorBoundary() {
  return (
    <section className="mx-auto grid w-[min(100%_-_2rem,40rem)] gap-5">
      <div className="space-y-5">
        <p className="m-0 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Publication boundary</p>
        <h1 className="publication-home-title text-4xl">
          The page hit an unexpected error.
        </h1>
        <p className="publication-home-summary">
          Retry the page or return to the public reading surfaces. The failure was captured in the app boundary.
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="publication-link" onClick={() => window.location.reload()} type="button">
            Try again
          </button>
          <NextLink className="publication-link" href="/">
            Open homepage
          </NextLink>
          <NextLink className="publication-link" href="/?type=writing">
            Open writing
          </NextLink>
        </div>
      </div>
    </section>
  );
}
