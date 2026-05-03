export type StackIcon =
  | {
      kind: "emoji";
      value: string;
    }
  | {
      kind: "url";
      value: string;
    };

export type StackListItem = {
  name: string;
  link: string;
  description: string;
  platforms: string[];
  tags: string[];
  icon?: StackIcon | null;
};

export type NotionStackRecord = StackListItem & {
  id: string;
};
