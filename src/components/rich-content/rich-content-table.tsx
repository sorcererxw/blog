"use client";

import { Table } from "@heroui/react";

type RichContentTableProps = {
  "aria-label": string;
  children: React.ReactNode;
};

function RichContentTable({ children, ...props }: RichContentTableProps) {
  return (
    <Table variant="secondary">
      <Table.ScrollContainer>
        <Table.Content className="min-w-full" {...props}>
          {children}
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}

const RichContentTableHeader = Table.Header;
const RichContentTableColumn = Table.Column;
const RichContentTableBody = Table.Body;
const RichContentTableRow = Table.Row;
const RichContentTableCell = Table.Cell;

export {
  RichContentTable,
  RichContentTableHeader,
  RichContentTableColumn,
  RichContentTableBody,
  RichContentTableRow,
  RichContentTableCell,
};
