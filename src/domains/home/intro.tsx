import { Fragment, type ReactNode } from "react";
import NextLink from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { ResponsiveRemoteImage } from "@/components/media/responsive-remote-image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { HomePageBlock } from "@/integrations/notion/home";

import styles from "./intro.module.css";

type HomePageContentProps = {
  blocks: HomePageBlock[];
  className?: string;
};

type NotionRichText = {
  plain_text?: string;
  href?: string | null;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
  };
  text?: {
    content?: string;
    link?: { url?: string | null } | null;
  };
};

const isListBlock = (type: string) =>
  type === "bulleted_list_item" || type === "numbered_list_item";

const getBlockValue = (block: HomePageBlock) =>
  block[block.type] as { rich_text?: unknown; caption?: unknown; url?: string } | undefined;

const getRichText = (block: HomePageBlock): NotionRichText[] => {
  const value = getBlockValue(block);

  if (!value || !Array.isArray(value.rich_text)) {
    return [];
  }

  return value.rich_text as NotionRichText[];
};

const readPlainText = (value: unknown): string => {
  if (!Array.isArray(value)) {
    return "";
  }

  return value
    .map((part) => {
      if (typeof part !== "object" || part === null) {
        return "";
      }

      const item = part as NotionRichText;

      return item.plain_text ?? item.text?.content ?? "";
    })
    .join("")
    .trim();
};

const hasVisibleRichText = (richText: NotionRichText[]): boolean =>
  richText.some((segment) => (segment.plain_text ?? segment.text?.content ?? "").trim().length > 0);

const inferImageDimensions = (url: string): { width: number; height: number } | null => {
  const matched = url.match(/\/(\d+)x(\d+)(@(\d+)x)?(?:\?|$)/i);

  if (!matched) {
    return null;
  }

  const width = Number(matched[1]);
  const height = Number(matched[2]);
  const scale = matched[4] ? Number(matched[4]) : 1;

  return {
    width: width * scale,
    height: height * scale,
  };
};

function renderRichText(richText: NotionRichText[]): ReactNode[] {
  return richText.map((segment, index) => {
    const text = segment.plain_text ?? segment.text?.content ?? "";

    if (!text) {
      return null;
    }

    let content: ReactNode = <>{text}</>;
    const href = segment.href ?? segment.text?.link?.url ?? null;

    if (href) {
      content = (
        <NextLink
          className="break-all text-primary underline underline-offset-4"
          href={href}
          rel="noreferrer"
          target="_blank"
        >
          {content}
        </NextLink>
      );
    }

    if (segment.annotations?.code) {
      content = (
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm">{content}</code>
      );
    }

    if (segment.annotations?.bold) {
      content = <strong>{content}</strong>;
    }

    if (segment.annotations?.italic) {
      content = <em>{content}</em>;
    }

    if (segment.annotations?.underline) {
      content = <u>{content}</u>;
    }

    if (segment.annotations?.strikethrough) {
      content = <s>{content}</s>;
    }

    return <span key={index}>{content}</span>;
  });
}

function renderChildren(block: HomePageBlock) {
  if (block.children.length === 0) {
    return null;
  }

  return <div className="mt-4 space-y-4">{renderBlocks(block.children)}</div>;
}

function renderListItems(items: HomePageBlock[], ordered: boolean) {
  const listClass = ordered ? "list-decimal" : "list-disc";
  const ListTag = ordered ? "ol" : "ul";

  return (
    <ListTag className={cn("grid grid-cols-1 gap-3 pl-5", listClass)}>
      {items.map((item) => (
        <li key={item.id} className="text-base text-foreground md:text-lg">
          <div className="space-y-3">
            <div>{renderRichText(getRichText(item))}</div>
            {item.children.length > 0 ? <div className="space-y-3">{renderBlocks(item.children)}</div> : null}
          </div>
        </li>
      ))}
    </ListTag>
  );
}

function renderBlock(block: HomePageBlock): ReactNode {
  const value = getBlockValue(block);

  switch (block.type) {
    case "heading_1":
      return (
        <>
          <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {renderRichText(getRichText(block))}
          </h1>
          {renderChildren(block)}
        </>
      );
    case "heading_2":
      return (
        <>
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            {renderRichText(getRichText(block))}
          </h2>
          {renderChildren(block)}
        </>
      );
    case "heading_3":
      return (
        <>
          <h3 className="font-serif text-xl font-semibold tracking-tight text-foreground sm:text-2xl md:text-3xl">
            {renderRichText(getRichText(block))}
          </h3>
          {renderChildren(block)}
        </>
      );
    case "paragraph":
      if (!hasVisibleRichText(getRichText(block))) {
        return renderChildren(block);
      }

      return (
        <>
          <p>
            {renderRichText(getRichText(block))}
          </p>
          {renderChildren(block)}
        </>
      );
    case "quote":
      return (
        <>
          <blockquote>
            {renderRichText(getRichText(block))}
          </blockquote>
          {renderChildren(block)}
        </>
      );
    case "callout": {
      const callout = value as { icon?: { type?: string; emoji?: string } | null } | undefined;
      const icon = callout?.icon?.type === "emoji" ? callout.icon.emoji : null;

      return (
        <Card className={styles.callout}>
          <CardContent className="grid grid-cols-[auto_1fr] gap-4 pt-4">
            <div className="pt-1 text-xl text-muted-foreground">{icon ?? "!"}</div>
            <div className="space-y-3 text-base leading-8 text-foreground md:text-lg">
              <div>
                {renderRichText(getRichText(block))}
              </div>
              {renderChildren(block)}
            </div>
          </CardContent>
        </Card>
      );
    }
    case "code":
      return (
        <>
          <pre className="overflow-x-auto text-sm text-foreground">
            <code className="whitespace-pre-wrap font-mono">
              {(value as { language?: string | null } | undefined)?.language
                ? `${(value as { language?: string | null }).language}\n`
                : ""}
              {renderRichText(getRichText(block))}
            </code>
          </pre>
          {renderChildren(block)}
        </>
      );
    case "image": {
      const image = value as { external?: { url?: string }; file?: { url?: string }; caption?: unknown } | undefined;
      const url = image?.external?.url ?? image?.file?.url ?? "";

      if (!url) {
        return null;
      }

      const caption = image?.caption ? readPlainText(image.caption) : "";
      const dimensions = inferImageDimensions(url);

      return (
        <>
          <figure className="space-y-3">
            <ResponsiveRemoteImage
              alt={caption || ""}
              className="object-cover"
              height={dimensions?.height}
              preset="content-image"
              src={url}
              width={dimensions?.width}
            />
            {caption ? (
              <figcaption>
                {caption}
              </figcaption>
            ) : null}
          </figure>
          {renderChildren(block)}
        </>
      );
    }
    case "bookmark": {
      const bookmark = value as { url?: string; caption?: unknown } | undefined;
      const url = bookmark?.url ?? "";

      if (!url) {
        return null;
      }

      return (
        <>
          <NextLink
            className={styles.bookmarkLink}
            href={url}
            rel="noreferrer"
            target="_blank"
          >
            <Card className={styles.bookmark}>
              <CardHeader className="gap-2">
                <CardDescription className="text-sm font-medium text-muted-foreground">
                  Reference
                </CardDescription>
                <CardTitle className="font-serif text-xl text-foreground">
                  {readPlainText(bookmark?.caption) || url}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="break-all text-sm text-muted-foreground">{url}</p>
              </CardContent>
            </Card>
          </NextLink>
          {renderChildren(block)}
        </>
      );
    }
    case "divider":
      return (
        <>
          <Separator className={styles.divider} />
          {renderChildren(block)}
        </>
      );
    case "toggle":
      return (
        <details>
          <summary className="cursor-pointer font-medium text-foreground">
            {renderRichText(getRichText(block))}
          </summary>
          {renderChildren(block)}
        </details>
      );
    case "column_list": {
      const columns = block.children;

      if (columns.length === 0) {
        return null;
      }

      return (
        <div
          className={cn(
            "grid gap-4",
            columns.length === 2
              ? "md:grid-cols-2"
              : columns.length === 3
                ? "md:grid-cols-3"
                : "md:grid-cols-2",
          )}
        >
          {columns.map((column) => (
            <div key={column.id} className="space-y-4">
              {renderBlocks(column.children)}
            </div>
          ))}
        </div>
      );
    }
    case "column":
      return <div className="space-y-4">{renderBlocks(block.children)}</div>;
    case "table": {
      const table = value as {
        has_column_header?: boolean;
        has_row_header?: boolean;
        rows?: Array<{
          cells?: Array<{
            rich_text?: unknown;
          }>;
        }>;
      } | undefined;

      if (!Array.isArray(table?.rows) || table.rows.length === 0) {
        return null;
      }

      return (
        <div className={styles.tableShell}>
          <Table className="w-full text-left">
            {table.has_column_header ? (
              <TableHeader>
                <TableRow>
                  {(table.rows[0]?.cells ?? []).map((cell, cellIndex) => (
                    <TableHead key={cellIndex} scope="col">
                      {renderRichText((cell.rich_text as NotionRichText[] | undefined) ?? [])}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
            ) : null}
            <TableBody>
              {table.rows
                .slice(table.has_column_header ? 1 : 0)
                .map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {(row.cells ?? []).map((cell, cellIndex) => {
                      const content = renderRichText(
                        (cell.rich_text as NotionRichText[] | undefined) ?? [],
                      );

                      if (table.has_row_header && cellIndex === 0) {
                        return (
                          <TableHead key={cellIndex} scope="row">
                            {content}
                          </TableHead>
                        );
                      }

                      return <TableCell key={cellIndex}>{content}</TableCell>;
                    })}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      );
    }
    default:
      return renderChildren(block);
  }
}

function renderBlocks(blocks: HomePageBlock[]): ReactNode[] {
  const nodes: ReactNode[] = [];

  for (let index = 0; index < blocks.length;) {
    const block = blocks[index];

    if (isListBlock(block.type)) {
      const ordered = block.type === "numbered_list_item";
      const listBlocks: HomePageBlock[] = [];

      while (index < blocks.length && blocks[index].type === block.type) {
        listBlocks.push(blocks[index]);
        index += 1;
      }

      nodes.push(
        <Fragment key={`${block.id}-list`}>
          {renderListItems(listBlocks, ordered)}
        </Fragment>,
      );
      continue;
    }

    const content = renderBlock(block);

    if (content == null) {
      index += 1;
      continue;
    }

    nodes.push(
      <Fragment key={block.id}>
        {content}
      </Fragment>,
    );
    index += 1;
  }

  return nodes;
}

export function HomePageContent({ blocks, className }: HomePageContentProps) {
  if (blocks.length === 0) {
    return (
      <section className={cn(styles.page, className)} aria-label="Home page content empty state">
        <div className={styles.emptyState}>
          <Empty>
            <EmptyContent>
              <EmptyTitle>Home</EmptyTitle>
              <EmptyDescription>The home page content is empty.</EmptyDescription>
            </EmptyContent>
          </Empty>
        </div>
      </section>
    );
  }

  return (
    <section className={cn(styles.page, className)} aria-label="Home page content">
      <div className={styles.reading}>{renderBlocks(blocks)}</div>
    </section>
  );
}
