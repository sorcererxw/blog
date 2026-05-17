export type ProjectListItem = {
  title: string;
  description: string;
  url: string;
  emoji: string | null;
  displayedAt?: Date | null;
  moduleSize?: string | null;
  period?: Date | null;
};

export type NotionProjectRecord = ProjectListItem & {
  id: string;
  period: Date;
};
