import { useState, useMemo } from "react";
import { StoryCard } from "../StoryCard";
import { useApp } from "@/store/app-store";
import { Search, X } from "lucide-react";

export function ExploreView() {
  const { stories } = useApp();
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    if (!q) return stories;
    const lowerQ = q.toLowerCase();
    return stories.filter(s => s.title.toLowerCase().includes(lowerQ));
  }, [stories, q]);

  return (
    <div className="animate-fade-in flex flex-col min-h-full">
      {/* Top Bar: Search */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-3 py-3 border-b border-border flex items-center gap-2">
        <div className="flex-1 h-10 rounded-full bg-surface border border-border flex items-center px-3 focus-within:border-foreground transition-colors shadow-sm">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search explore..."
            className="flex-1 bg-transparent outline-none text-[15px] ml-2 text-foreground placeholder:text-muted-foreground"
          />
          {q && (
            <button onClick={() => setQ("")} className="shrink-0 p-1 active:scale-90 transition">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Grid — square cards, no overlap */}
      <div className="flex-1 px-4 pt-4">
        <div className="grid grid-cols-2 gap-4">
          {list.map(s => (
            <StoryCard key={s.id} story={s} square />
          ))}
        </div>
        {list.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-[15px]">
            No stories found.
          </div>
        )}
      </div>
    </div>
  );
}
