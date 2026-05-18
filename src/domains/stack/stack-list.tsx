"use client";

import NextLink from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldContent,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { buildCloudflareImageUrl } from "@/lib/images/cloudflare";

import type { StackListItem } from "./types";

type StackListProps = {
  items: StackListItem[];
  className?: string;
};

const FILTER_PLACEHOLDER = {
  platform: "-- Platform --",
  category: "-- Category --",
} as const;

function toSelectValue(value: string) {
  return value === "" ? null : value;
}

function fromSelectValue(value: string | null) {
  return value ?? "";
}

function StackIcon({ item }: { item: StackListItem }) {
  if (!item.icon) {
    return null;
  }

  if (item.icon.kind === "emoji") {
    return (
      <span className="inline-flex h-6 min-w-6 items-center justify-center text-base leading-none text-muted-foreground">
        {item.icon.value}
      </span>
    );
  }

  return (
    <span
      aria-label={`${item.name} icon`}
      className="h-8 w-8 rounded-full border border-border bg-card bg-cover bg-center bg-no-repeat"
      role="img"
      style={{
        backgroundImage: `url(${buildCloudflareImageUrl(item.icon.value, "icon")})`,
      }}
    />
  );
}

function ChipRow({
  label,
  values,
}: {
  label: string;
  values: string[];
}) {
  if (values.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-2">
      <p className="m-0 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <Badge key={`${label}-${value}`} variant="outline">
            {value}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

type StackListViewProps = StackListProps & {
  platform: string;
  category: string;
  onPlatformChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onClearFilters: () => void;
};

export function StackListView({
  items,
  className,
  platform,
  category,
  onPlatformChange,
  onCategoryChange,
  onClearFilters,
}: StackListViewProps) {
  const platformOptions = useMemo(
    () => uniqueSorted(items.flatMap((item) => item.platforms)),
    [items],
  );
  const categoryOptions = useMemo(
    () => uniqueSorted(items.flatMap((item) => item.tags)),
    [items],
  );

  const visibleItems = items
    .filter((item) => !platform || item.platforms.includes(platform))
    .filter((item) => !category || item.tags.includes(category));

  return (
    <section aria-label="Stack" className={cn("grid w-full max-w-3xl gap-5", className)}>
      <header className="grid gap-2">
        <p className="m-0 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Engineering stack</p>
        <h1 className="m-0 text-balance font-serif text-4xl font-medium leading-none tracking-tighter md:text-5xl">
          The tools, runtimes, and services behind how the site ships.
        </h1>
        <p className="m-0 text-base leading-loose text-muted-foreground">
          This stack page documents the software, infrastructure, and deployment surfaces
          used to publish, debug, and maintain the site.
        </p>
      </header>

      <div className="grid gap-3 lg:grid-cols-2" aria-label="Stack filters">
        <Field className="grid gap-2">
          <FieldLabel className="text-xs font-semibold uppercase tracking-widest text-muted-foreground" htmlFor="stack-platform-filter">
            Platform
          </FieldLabel>
          <FieldContent>
            <Select
              value={toSelectValue(platform)}
              onValueChange={(value) => onPlatformChange(fromSelectValue(value))}
            >
              <SelectTrigger
                aria-label="Platform"
                className="h-auto w-full rounded-xl border-border bg-card px-4 py-3 text-base leading-snug"
                id="stack-platform-filter"
              >
                <SelectValue placeholder={FILTER_PLACEHOLDER.platform} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>{FILTER_PLACEHOLDER.platform}</SelectItem>
                {platformOptions.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>

        <Field className="grid gap-2">
          <FieldLabel className="text-xs font-semibold uppercase tracking-widest text-muted-foreground" htmlFor="stack-category-filter">
            Category
          </FieldLabel>
          <FieldContent>
            <Select
              value={toSelectValue(category)}
              onValueChange={(value) => onCategoryChange(fromSelectValue(value))}
            >
              <SelectTrigger
                aria-label="Category"
                className="h-auto w-full rounded-xl border-border bg-card px-4 py-3 text-base leading-snug"
                id="stack-category-filter"
              >
                <SelectValue placeholder={FILTER_PLACEHOLDER.category} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>{FILTER_PLACEHOLDER.category}</SelectItem>
                {categoryOptions.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>
      </div>

      <Separator className="m-0" />

      {items.length === 0 ? (
        <Empty className="m-0 grid gap-3 text-base leading-7 text-muted-foreground">
          <EmptyContent>
            <EmptyTitle>No stack entries published yet.</EmptyTitle>
          </EmptyContent>
        </Empty>
      ) : visibleItems.length === 0 ? (
        <Empty className="m-0 grid gap-3 text-base leading-7 text-muted-foreground">
          <EmptyContent>
            <EmptyTitle>No matching entries for the selected filters.</EmptyTitle>
            <Button
              className="justify-self-start rounded-full"
              onClick={onClearFilters}
              size="sm"
              type="button"
              variant="outline"
            >
              Clear filters
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleItems.map((item) => (
            <article key={`${item.name}-${item.link}`}>
              <Card className="overflow-clip rounded-2xl bg-[color:color-mix(in_oklab,var(--background)_92%,var(--card)_8%)] py-0">
                <NextLink
                  className="grid gap-4 p-4 transition-[color,transform,border-color] duration-150 hover:-translate-y-0.5 [&:hover_.stack-card-title]:text-foreground [&:hover_.stack-summary]:text-foreground"
                  href={item.link}
                  rel="noreferrer"
                  target="_blank"
                >
                  <div className="flex min-w-0 items-start justify-between gap-4">
                    <div className="space-y-2">
                      <h2 className="stack-card-title m-0 text-pretty font-serif text-xl font-medium leading-tight tracking-tight md:text-2xl">
                        {item.name}
                      </h2>
                      <p className="m-0 break-all text-base leading-relaxed text-muted-foreground">
                        {item.link}
                      </p>
                    </div>
                    <StackIcon item={item} />
                  </div>

                  <p className="stack-summary m-0 text-base leading-loose text-muted-foreground">
                    {item.description}
                  </p>

                  <div className="grid gap-4">
                    <ChipRow label="Platforms" values={item.platforms} />
                    <ChipRow label="Tags" values={item.tags} />
                  </div>
                </NextLink>
              </Card>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function StackList({ items, className }: StackListProps) {
  const [platform, setPlatform] = useState("");
  const [category, setCategory] = useState("");

  return (
    <StackListView
      className={className}
      category={category}
      items={items}
      onCategoryChange={setCategory}
      onClearFilters={() => {
        setPlatform("");
        setCategory("");
      }}
      onPlatformChange={setPlatform}
      platform={platform}
    />
  );
}
