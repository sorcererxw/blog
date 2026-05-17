import { Fragment, type ReactNode } from "react";
import NextLink from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { buildCloudflareImageUrl } from "@/lib/images/cloudflare";
import { ResponsiveRemoteImage } from "@/components/media/responsive-remote-image";

import type {
  ArticleDetail,
  ArticleDetailBlock,
  ArticleDetailRichText,
  ArticleDetailTocNode,
} from "./article-detail-types";
import styles from "./article-detail-view.module.css";

type ArticleDetailViewProps = {
  article: ArticleDetail;
  className?: string;
};

const colorToClassName = (color?: string | null) => {
  switch (color) {
    case "gray":
      return styles.calloutGray;
    case "brown":
      return styles.calloutBrown;
    case "orange":
      return styles.calloutOrange;
    case "yellow":
      return styles.calloutYellow;
    case "green":
      return styles.calloutGreen;
    case "blue":
      return styles.calloutBlue;
    case "purple":
      return styles.calloutPurple;
    case "pink":
      return styles.calloutPink;
    case "red":
      return styles.calloutRed;
    case "gray_background":
      return styles.calloutGrayBackground;
    case "brown_background":
      return styles.calloutBrownBackground;
    case "orange_background":
      return styles.calloutOrangeBackground;
    case "yellow_background":
      return styles.calloutYellowBackground;
    case "green_background":
      return styles.calloutGreenBackground;
    case "blue_background":
      return styles.calloutBlueBackground;
    case "purple_background":
      return styles.calloutPurpleBackground;
    case "pink_background":
      return styles.calloutPinkBackground;
    case "red_background":
      return styles.calloutRedBackground;
    default:
      return "";
  }
};

function formatArticleDetailDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

const toPlainText = (
  richText?: ArticleDetailRichText[],
  fallback?: string,
): string => {
  if (richText && richText.length > 0) {
    return richText.map((segment) => segment.plainText).join("");
  }

  return fallback ?? "";
};

function renderRichText(richText?: ArticleDetailRichText[], fallback?: string): ReactNode {
  const segments =
    richText && richText.length > 0
      ? richText
      : fallback
        ? [{ plainText: fallback }]
        : [];

  return segments.map((segment, index) => {
    let content: ReactNode = <>{segment.plainText}</>;

    if (segment.href) {
      content = (
        <NextLink
          className="break-all text-primary underline underline-offset-4"
          href={segment.href}
          rel="noreferrer"
          target="_blank"
        >
          {content}
        </NextLink>
      );
    }

    if (segment.code) {
      content = (
        <code className={styles.inlineCode}>{content}</code>
      );
    }

    if (segment.bold) {
      content = <strong>{content}</strong>;
    }

    if (segment.italic) {
      content = <em>{content}</em>;
    }

    if (segment.underline) {
      content = <u>{content}</u>;
    }

    if (segment.strikethrough) {
      content = <s>{content}</s>;
    }

    return <span key={index}>{content}</span>;
  });
}

const renderCaption = (richText?: ArticleDetailRichText[], fallback?: string | null) => {
  const text = toPlainText(richText, fallback ?? undefined);

  if (!text) {
    return null;
  }

  return <figcaption>{renderRichText(richText, fallback ?? undefined)}</figcaption>;
};

function renderToc(nodes: ArticleDetailTocNode[]): ReactNode {
  return nodes.map((node) => (
    <Fragment key={node.id}>
      <NextLink className={styles.tocLink} href={`#${node.id}`}>
        {node.title}
      </NextLink>
      {node.nodes.length > 0 ? <div className={styles.tocChildren}>{renderToc(node.nodes)}</div> : null}
    </Fragment>
  ));
}

function renderChildren(children?: ArticleDetailBlock[]) {
  if (!children || children.length === 0) {
    return null;
  }

  return <div className={styles.children}>{renderBlockList(children)}</div>;
}

function renderListItems(items: Extract<ArticleDetailBlock, { kind: "list-item" }>[], ordered: boolean) {
  const ListTag = ordered ? "ol" : "ul";

  return (
    <ListTag>
      {items.map((item, index) => (
        <li key={`${ordered ? "ordered" : "bullet"}-${index}`}>
          <div className={styles.listItemContent}>
            <div>{renderRichText(item.richText, item.text)}</div>
            {renderChildren(item.children)}
          </div>
        </li>
      ))}
    </ListTag>
  );
}

function renderBlock(block: ArticleDetailBlock) {
  switch (block.kind) {
    case "heading": {
      const Tag = block.level === 1 ? "h2" : block.level === 2 ? "h3" : "h4";

      return (
        <>
          <Tag
            className={cn(
              block.level === 1
                ? "font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
                : block.level === 2
                  ? "font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
                  : "font-serif text-xl font-semibold tracking-tight text-foreground md:text-2xl",
            )}
            id={block.id}
          >
            <span>{renderRichText(block.richText, block.text)}</span>
            {block.id ? (
              <NextLink className={styles.headingAnchor} href={`#${block.id}`}>
                ¶
              </NextLink>
            ) : null}
          </Tag>
          {renderChildren(block.children)}
        </>
      );
    }
    case "paragraph":
      return (
        <>
          <p>{renderRichText(block.richText, block.text)}</p>
          {renderChildren(block.children)}
        </>
      );
    case "quote":
      return (
        <>
          <blockquote>{renderRichText(block.richText, block.text)}</blockquote>
          {renderChildren(block.children)}
        </>
      );
    case "code":
      if (block.renderHtml && block.text.startsWith("<!--render-->")) {
        return (
          <figure className="space-y-3">
            <div dangerouslySetInnerHTML={{ __html: block.text }} />
            {renderCaption(block.caption)}
          </figure>
        );
      }

      return (
        <figure className="space-y-3">
          <div className="grid gap-2">
            {block.language ? (
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {block.language}
              </p>
            ) : null}
            {block.highlightedHtml ? (
              <div
                className={styles.highlightedCode}
                dangerouslySetInnerHTML={{ __html: block.highlightedHtml }}
              />
            ) : (
              <pre className="overflow-x-auto text-sm text-foreground">
                <code className="whitespace-pre-wrap font-mono">{block.text}</code>
              </pre>
            )}
          </div>
          {renderCaption(block.caption)}
        </figure>
      );
    case "image":
      return (
        <figure className="space-y-3">
          <ResponsiveRemoteImage
            alt={block.caption ?? ""}
            height={block.height}
            preset="content-image"
            src={block.url}
            width={block.width}
          />
          {renderCaption(block.captionRichText, block.caption)}
        </figure>
      );
    case "bookmark":
      return (
        <figure className="space-y-3">
          <NextLink className={styles.bookmarkLink} href={block.url} rel="noreferrer" target="_blank">
            <Card className={styles.bookmark}>
              {block.imageUrl ? (
                <div className={styles.bookmarkImageWrap}>
                  <ResponsiveRemoteImage
                    alt=""
                    className={styles.bookmarkImage}
                    preset="bookmark-thumb"
                    src={block.imageUrl}
                  />
                </div>
              ) : null}
              <CardHeader className="gap-2">
                <CardDescription className="text-sm font-medium text-muted-foreground">
                  Reference
                </CardDescription>
                <CardTitle className="font-serif text-xl text-foreground">
                  {block.title ?? block.url}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {block.description ? (
                  <p className="text-sm text-muted-foreground">{block.description}</p>
                ) : null}
                <p className="break-all text-sm text-muted-foreground">{block.url}</p>
              </CardContent>
            </Card>
          </NextLink>
          {renderCaption(block.captionRichText, block.caption)}
        </figure>
      );
    case "divider":
      return <Separator className={styles.divider} />;
    case "callout":
      return (
        <Card className={cn(styles.callout, colorToClassName(block.color))}>
          <CardContent className="grid grid-cols-[auto_1fr] gap-4 pt-4">
            <div className="pt-1 text-xl text-muted-foreground">{block.emoji ?? "!"}</div>
            <div className="space-y-3 text-base leading-8 text-foreground md:text-lg">
              <div>{renderRichText(block.richText, block.text)}</div>
              {renderChildren(block.children)}
            </div>
          </CardContent>
        </Card>
      );
    case "todo":
      return (
        <div className={styles.todo}>
          <input checked={block.checked} disabled type="checkbox" />
          <div>
            <div>{renderRichText(block.richText, block.text)}</div>
            {renderChildren(block.children)}
          </div>
        </div>
      );
    case "toggle":
      return (
        <details>
          <summary className="cursor-pointer font-medium text-foreground">
            {renderRichText(block.richText, block.text)}
          </summary>
          {renderChildren(block.children)}
        </details>
      );
    case "table":
      return (
        <div className={styles.tableShell}>
          <Table className="w-full text-left">
            <TableBody>
              {block.rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {row.cells.map((cell, cellIndex) =>
                    cell.header ? (
                      <TableHead
                        key={cellIndex}
                        className="whitespace-normal break-words align-top"
                      >
                        {renderRichText(cell.richText)}
                      </TableHead>
                    ) : (
                      <TableCell
                        key={cellIndex}
                        className="whitespace-normal break-words align-top"
                      >
                        {renderRichText(cell.richText)}
                      </TableCell>
                    ),
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    case "tableOfContent":
      return <div className={styles.toc}>{renderToc(block.nodes)}</div>;
    case "columns":
      return (
        <div
          className={cn(
            styles.columns,
            block.columns.length === 2
              ? styles.columns2
              : block.columns.length === 3
                ? styles.columns3
                : styles.columns2,
          )}
        >
          {block.columns.map((column) => (
            <div key={column.id} className={styles.column}>
              {renderBlockList(column.children)}
            </div>
          ))}
        </div>
      );
    case "video":
      return (
        <figure className="space-y-3">
          <video controls src={block.url} />
          {renderCaption(block.captionRichText, block.caption)}
        </figure>
      );
    case "linkPreview":
      return <iframe height="500" src={block.url} width="100%" />;
    default:
      return null;
  }
}

function renderBlockList(blocks: ArticleDetailBlock[]) {
  const renderedBlocks: ReactNode[] = [];
  let activeOrdered: boolean | null = null;
  let listBlocks: Extract<ArticleDetailBlock, { kind: "list-item" }>[] = [];
  let listStartIndex = -1;

  const flushListBlocks = () => {
    if (listBlocks.length === 0 || activeOrdered === null) {
      return;
    }

    renderedBlocks.push(
      <Fragment key={`list-${listStartIndex}`}>
        {renderListItems(listBlocks, activeOrdered)}
      </Fragment>,
    );

    activeOrdered = null;
    listBlocks = [];
    listStartIndex = -1;
  };

  blocks.forEach((block, index) => {
    if (block.kind === "list-item") {
      if (activeOrdered === null) {
        activeOrdered = block.ordered;
        listStartIndex = index;
      }

      if (activeOrdered === block.ordered) {
        listBlocks.push(block);
        return;
      }

      flushListBlocks();
      activeOrdered = block.ordered;
      listStartIndex = index;
      listBlocks.push(block);
      return;
    }

    flushListBlocks();
    renderedBlocks.push(
      <div
        key={`${block.kind}-${index}`}
        className={cn(
          block.kind === "image" || block.kind === "bookmark" ? styles.mediaBlock : "",
        )}
      >
        {renderBlock(block)}
      </div>,
    );
  });

  flushListBlocks();

  return renderedBlocks;
}

export function ArticleDetailView({ article, className }: ArticleDetailViewProps) {
  const archiveHref = "/?type=writing";
  const authorHref = "/";
  const date = formatArticleDetailDate(article.date);
  const iconLabel = article.icon?.kind === "emoji" ? article.icon.value : null;

  return (
    <article className={cn(styles.article, className)}>
      <div className={styles.page}>
        <header className={styles.hero}>
          <div className={styles.coverWrap} aria-hidden={article.cover ? undefined : true}>
            {article.cover ? (
              <ResponsiveRemoteImage
                alt={article.title}
                className={styles.cover}
                fetchPriority="high"
                preset="hero"
                src={article.cover}
              />
            ) : (
              <div className={cn(styles.cover, styles.coverEmpty)}>
                <span className={styles.coverFallback}>Article</span>
              </div>
            )}
          </div>

          <div className={styles.head}>
            <h1 className={styles.headline}>{article.title}</h1>

            <div className={styles.byline}>
              <span className={styles.authorBadge} aria-hidden="true">
                {iconLabel ? (
                  <span className={styles.mark}>{iconLabel}</span>
                ) : article.icon?.kind === "url" ? (
                  <span
                    className={styles.iconImage}
                    style={{ backgroundImage: `url(${buildCloudflareImageUrl(article.icon.value, "icon")})` }}
                  />
                ) : (
                  <span className={styles.authorInitial}>S</span>
                )}
              </span>
              <NextLink className={styles.authorLink} href={authorHref}>
                sorcererxw
              </NextLink>
              <span className={styles.separator} aria-hidden="true">
                •
              </span>
              <time className={styles.date} dateTime={article.date.toISOString()}>
                {date}
              </time>
            </div>
          </div>
        </header>

        <div className={styles.body}>
          <section aria-label="Article content" className={styles.reading}>
            {article.blocks.length > 0 ? (
              renderBlockList(article.blocks)
            ) : (
              <p className="publication-note">This article has no rendered content blocks yet.</p>
            )}
          </section>

          <footer className={styles.endMatter}>
            <NextLink className="publication-button" href={archiveHref}>
              Back to writing
            </NextLink>
          </footer>
        </div>
      </div>
    </article>
  );
}

export { formatArticleDetailDate };
