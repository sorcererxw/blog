import { HomePageContent } from "./intro";
import type { HomePageBlock } from "@/integrations/notion/home";

type ProfileHeroProps = {
  blocks: HomePageBlock[];
};

export function ProfileHero({ blocks }: ProfileHeroProps) {
  return (
    <section
      aria-label="Profile hero"
      className="relative mx-auto w-full max-w-6xl px-5 pb-8 pt-12"
      id="profile"
    >
      <div className="max-h-none overflow-visible">
        <HomePageContent blocks={blocks} />
      </div>
    </section>
  );
}
