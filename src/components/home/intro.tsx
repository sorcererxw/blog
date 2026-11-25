import * as tableComponents from "@/components/rich-content/rich-content-table";

import {
  HomePageContentBase,
  type HomePageContentProps,
} from "./intro-content";

export function HomePageContent(props: Omit<HomePageContentProps, "tableComponents">) {
  return <HomePageContentBase {...props} tableComponents={tableComponents} />;
}
