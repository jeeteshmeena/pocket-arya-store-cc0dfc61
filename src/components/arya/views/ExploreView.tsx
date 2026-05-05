import { useState } from "react";
import { StoryCard } from "../StoryCard";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

export function ExploreView() {
  const { stories } = useApp();
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);

  // Auto-generate genres and platforms from real DB data
  const genres = Array.from(new Set(stories.map((s) => s.genre).filter(Boolean))).sort();
  const platforms = Array.from(new Set(stories.map((s) => s.platform).filter(Boolean))).sort();

  const list = stories.filter((s) => {
    const genreMatch = !activeGenre || s.genre === activeGenre;
    const platformMatch = !activePlatform || s.platform === activePlatform;
    return genreMatch && platformMatch;
  });

  return (
    <div className="animate-fade-in px-4 pt-3 pb-8">
      <h1 className="font-display font-bold text-xl pfm:text-2xl">Explore</h1>

      {/* Platform filter */}
      <div className="mt-3">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Platform</div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <Chip active={!activePlatform} onClick={() => setActivePlatform(null)}>All</Chip>
          {platforms.map((p) => (
            <Chip key={p} active={activePlatform === p} onClick={() => setActivePlatform(activePlatform === p ? null : p)}>{p}</Chip>
          ))}
        </div>
      </div>

      {/* Genre filter */}
      <div className="mt-3">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Genre</div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <Chip active={!activeGenre} onClick={() => setActiveGenre(null)}>All</Chip>
          {genres.map((g) => (
            <Chip key={g} active={activeGenre === g} onClick={() => setActiveGenre(activeGenre === g ? null : g)}>{g}</Chip>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="mt-1 text-xs text-muted-foreground px-0.5">{list.length} stories</div>
      <div className="mt-3 grid grid-cols-2 gap-4">
        {list.map((s) => (
          <div key={s.id} className="flex justify-center"><StoryCard story={s} wide /></div>
        ))}
        {list.length === 0 && (
          <div className="col-span-2 py-16 text-center text-sm text-muted-foreground">
            No stories found for this filter.
          </div>
        )}
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
