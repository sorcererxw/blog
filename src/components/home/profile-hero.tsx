import {
  HomePageContentBase,
  type RichContentTableComponents,
} from "./intro-content";
import type { HomePageBlock } from "@/integrations/notion/home";

type ProfileHeroProps = {
  blocks: HomePageBlock[];
  tableComponents?: RichContentTableComponents;
};

export function ProfileHero({ blocks, tableComponents }: ProfileHeroProps) {
  return (
    <section
      aria-label="Profile hero"
      className="relative mx-auto w-full max-w-6xl px-5 pb-8 pt-12"
      id="profile"
    >
      <div className="max-h-none overflow-visible">
        <HomePageContentBase blocks={blocks} tableComponents={tableComponents} />
      </div>
    </section>
  );
}
