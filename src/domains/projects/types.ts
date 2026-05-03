export type ProjectListItem = {
  title: string;
  description: string;
  url: string;
  emoji: string | null;
};

export type NotionProjectRecord = ProjectListItem & {
  id: string;
  period: Date;
};
