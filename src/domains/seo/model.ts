export type StructuredDataValue =
  | string
  | number
  | boolean
  | null
  | StructuredData
  | StructuredDataValue[];

export type StructuredData = {
  [key: string]: StructuredDataValue;
};

export type SeoImage = {
  url: string;
  alt: string;
  width?: number | null;
  height?: number | null;
};

export type SeoRouteKind =
  | "home"
  | "article"
  | "collection"
  | "query-entry"
  | "boundary";

export type SeoBuildInput = {
  pathname: string;
  title: string;
  description: string;
  kind: SeoRouteKind;
  queryFamily?: string | null;
  indexable?: boolean;
  image?: SeoImage | null;
  publishedTime?: string | null;
  modifiedTime?: string | null;
  structuredData?: StructuredData[];
};

export type SeoDocument = {
  kind: SeoRouteKind;
  queryFamily?: string | null;
  title: string;
  description: string;
  canonicalUrl: string;
  robots: string;
  indexable: boolean;
  openGraph: {
    title: string;
    description: string;
    type: "website" | "article";
    url: string;
    image?: SeoImage | null;
    publishedTime?: string | null;
    modifiedTime?: string | null;
  };
  twitter: {
    card: "summary" | "summary_large_image";
    title: string;
    description: string;
    image?: SeoImage | null;
  };
  structuredData: StructuredData[];
};
