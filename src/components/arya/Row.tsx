import type { Story } from "@/lib/data";
import { StoryCard } from "./StoryCard";
import { cn } from "@/lib/utils";
import { useApp } from "@/store/app-store";

export function Row({ title, stories, wide }: { title: string; stories: Story[]; wide?: boolean }) {
  const { theme } = useApp();
  if (!stories.length) return null;
  return (
    <section className="mt-5">
      <div className="px-4 mb-3 flex items-center justify-between">
        <h2 className={cn(
          "font-display tracking-tight text-foreground",
          theme === "cream" ? "text-xl font-extrabold" : theme === "pfm" ? "text-lg font-bold" : "text-base font-bold"
        )}>{title}</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
        {stories.map((s) => <StoryCard key={s.id} story={s} wide={wide} />)}
      </div>
    </section>
  );
}
