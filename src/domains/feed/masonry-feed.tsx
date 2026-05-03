import type { ReactNode } from "react";

import { cn } from "@/lib/classnames";

import styles from "./masonry-feed.module.css";

type MasonryFeedProps<T> = {
  items: T[];
  renderItem: (item: T) => ReactNode;
  calculateItemHeight: (item: T, columns: number) => number;
  getItemKey: (item: T, index: number) => string;
  className?: string;
};

function buildColumns<T>(
  items: T[],
  columnCount: number,
  calculateItemHeight: (item: T, columns: number) => number,
) {
  const columns = Array.from({ length: columnCount }, () => [] as T[]);
  const heights = new Array<number>(columnCount).fill(0);

  for (const item of items) {
    const shortestColumn = heights.indexOf(Math.min(...heights));
    const estimate = calculateItemHeight(item, columnCount);

    columns[shortestColumn]?.push(item);
    heights[shortestColumn] += estimate;
  }

  return columns;
}

export function MasonryFeed<T>({
  items,
  renderItem,
  calculateItemHeight,
  getItemKey,
  className,
}: MasonryFeedProps<T>) {
  const layouts = [
    { columns: 1, className: styles.mobileLayout },
    { columns: 2, className: styles.tabletLayout },
    { columns: 3, className: styles.desktopLayout },
  ];

  return (
    <div
      className={cn(styles.root, className)}
      data-layout="masonry-feed"
    >
      {layouts.map((layout) => {
        const columns = buildColumns(items, layout.columns, calculateItemHeight);

        return (
          <div
            key={layout.columns}
            className={layout.className}
            data-masonry-columns={layout.columns}
          >
            <div
              className={styles.grid}
              style={{
                gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
              }}
            >
              {columns.map((column, columnIndex) => (
                <div key={columnIndex} className={styles.column}>
                  {column.map((item, itemIndex) => {
                    const itemKey = getItemKey(item, itemIndex);
                    const estimate = calculateItemHeight(item, layout.columns);

                    return (
                      <div
                        key={itemKey}
                        className={styles.cell}
                        data-masonry-estimate={estimate}
                        data-masonry-item-key={itemKey}
                      >
                        {renderItem(item)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
