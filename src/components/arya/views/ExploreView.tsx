import { useState } from "react";
import { GENRES } from "@/lib/data";
import { StoryCard } from "../StoryCard";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

export function ExploreView() {
  const { stories } = useApp();
  const [genre, setGenre] = useState<string | null>(null);
  const list = genre ? stories.filter((s) => s.genre === genre) : stories;
  return (
    <div className="animate-fade-in px-4 pt-3">
      <h1 className="font-display font-bold text-xl pfm:text-2xl">Explore</h1>
      <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
        <Chip active={!genre} onClick={() => setGenre(null)}>All</Chip>
        {GENRES.map((g) => (
          <Chip key={g} active={genre === g} onClick={() => setGenre(g)}>{g}</Chip>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        {list.map((s) => (
          <div key={s.id} className="flex justify-center"><StoryCard story={s} wide /></div>
        ))}
      </div>
    </div>
  );
}

function Chip({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={cn(
      "shrink-0 h-9 px-4 rounded-full text-xs font-medium border transition",
      active ? "bg-primary text-primary-foreground border-primary" : "bg-surface border-border text-muted-foreground"
    )}>{children}</button>
  );
}
