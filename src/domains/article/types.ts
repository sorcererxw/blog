export type ArticleIcon =
  | {
      kind: "emoji";
      value: string;
    }
  | {
      kind: "url";
      value: string;
    };

export type ArticleListItem = {
  slug: string;
  title: string;
  summary: string;
  date: Date;
  cover?: string | null;
  icon?: ArticleIcon | null;
};

export type NotionArticleRecord = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  date: Date;
  cover?: string | null;
  icon?: ArticleIcon | null;
  wip?: boolean;
};

