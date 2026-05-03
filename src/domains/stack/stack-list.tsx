"use client";

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
import { cn } from "@/lib/classnames";
import { buildCloudflareImageUrl } from "@/lib/images/cloudflare";

import type { StackListItem } from "./types";
import styles from "./stack-list.module.css";

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
    return <span className={styles.mark}>{item.icon.value}</span>;
  }

  return (
    <span
      aria-label={`${item.name} icon`}
      className={styles.iconImage}
      role="img"
      style={{
        backgroundImage: `url(${buildCloudflareImageUrl(item.icon.value, "icon")})`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
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
    <div className={styles.metaGroup}>
      <p className="shell-eyebrow">{label}</p>
      <div className={styles.chipRow}>
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
    <section aria-label="Stack" className={cn(styles.stackList, className)}>
      <header className={styles.intro}>
        <p className="shell-eyebrow">Engineering stack</p>
        <h1 className={styles.title}>The tools, runtimes, and services behind how the site ships.</h1>
        <p className={styles.description}>
          This stack page documents the software, infrastructure, and deployment surfaces
          used to publish, debug, and maintain the site.
        </p>
      </header>

      <div className={styles.filters} aria-label="Stack filters">
        <Field className={styles.filter}>
          <FieldLabel className={styles.filterLabel} htmlFor="stack-platform-filter">
            Platform
          </FieldLabel>
          <FieldContent>
            <Select
              value={toSelectValue(platform)}
              onValueChange={(value) => onPlatformChange(fromSelectValue(value))}
            >
              <SelectTrigger
                aria-label="Platform"
                className={styles.select}
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

        <Field className={styles.filter}>
          <FieldLabel className={styles.filterLabel} htmlFor="stack-category-filter">
            Category
          </FieldLabel>
          <FieldContent>
            <Select
              value={toSelectValue(category)}
              onValueChange={(value) => onCategoryChange(fromSelectValue(value))}
            >
              <SelectTrigger
                aria-label="Category"
                className={styles.select}
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

      <Separator className={styles.divider} />

      {items.length === 0 ? (
        <Empty className={styles.emptyState}>
          <EmptyContent>
            <EmptyTitle>No stack entries published yet.</EmptyTitle>
          </EmptyContent>
        </Empty>
      ) : visibleItems.length === 0 ? (
        <Empty className={styles.emptyState}>
          <EmptyContent>
            <EmptyTitle>No matching entries for the selected filters.</EmptyTitle>
            <Button
              className={styles.clearButton}
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
        <div className={styles.grid}>
          {visibleItems.map((item) => (
            <article key={`${item.name}-${item.link}`}>
              <Card className={cn(styles.card, "py-0")}>
                <a className={styles.link} href={item.link} rel="noreferrer" target="_blank">
                  <div className={styles.cardHeader}>
                    <div className="space-y-2">
                      <h2 className={styles.cardTitle}>{item.name}</h2>
                      <p className={styles.linkText}>{item.link}</p>
                    </div>
                    <StackIcon item={item} />
                  </div>

                  <p className={styles.summary}>{item.description}</p>

                  <div className={styles.cardMeta}>
                    <ChipRow label="Platforms" values={item.platforms} />
                    <ChipRow label="Tags" values={item.tags} />
                  </div>
                </a>
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
