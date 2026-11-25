import type { ReactNode } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type RichContentTableProps = {
  "aria-label": string;
  children: ReactNode;
};

type RichContentTableHeaderProps = {
  children: ReactNode;
};

type RichContentTableColumnProps = {
  children?: ReactNode;
  className?: string;
  id?: string;
  isRowHeader?: boolean;
};

type RichContentTableBodyProps = {
  children: ReactNode;
};

type RichContentTableRowProps = {
  children: ReactNode;
  className?: string;
  id?: string | number;
};

type RichContentTableCellProps = {
  children?: ReactNode;
  className?: string;
  isRowHeader?: boolean;
};

function RichContentTable({ children, ...props }: RichContentTableProps) {
  return (
    <Table className="min-w-full" {...props}>
      {children}
    </Table>
  );
}

function RichContentTableHeader({ children }: RichContentTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>{children}</TableRow>
    </TableHeader>
  );
}

function RichContentTableColumn({
  children,
  className,
  id,
}: RichContentTableColumnProps) {
  return (
    <TableHead
      className={className}
      id={id}
      role="columnheader"
      scope="col"
    >
      {children}
    </TableHead>
  );
}

function RichContentTableBody({ children }: RichContentTableBodyProps) {
  return <TableBody>{children}</TableBody>;
}

function RichContentTableRow({
  children,
  className,
}: RichContentTableRowProps) {
  return <TableRow className={className}>{children}</TableRow>;
}

function RichContentTableCell({
  children,
  className,
  isRowHeader,
}: RichContentTableCellProps) {
  return (
    <TableCell
      className={className}
      role={isRowHeader ? "rowheader" : undefined}
    >
      {children}
    </TableCell>
  );
}

export {
  RichContentTable,
  RichContentTableBody,
  RichContentTableCell,
  RichContentTableColumn,
  RichContentTableHeader,
  RichContentTableRow,
};
