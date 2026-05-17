export type ProjectListItem = {
  title: string;
  description: string;
  url: string;
  emoji: string | null;
  displayedAt?: Date | null;
  presentationIntent?: "feature" | null;
  period?: Date | null;
};

export type NotionProjectRecord = ProjectListItem & {
  id: string;
  period: Date;
};
