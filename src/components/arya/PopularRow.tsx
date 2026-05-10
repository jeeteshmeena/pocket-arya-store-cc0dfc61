import { useEffect, useState } from "react";
import { useApp } from "@/store/app-store";
import { StoryCard } from "./StoryCard";
import { cn } from "@/lib/utils";

export function PopularRow() {
  const { theme, navigate } = useApp();
  const [popularStories, setPopularStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === "dark" || theme === "teal" || theme === "romantic";

  useEffect(() => {
    fetch("/api/popular")
      .then(r => r.json())
      .then(d => {
        if (d.success) setPopularStories(d.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="mt-8 mb-6 relative z-10">
        <div className="px-4 flex items-center justify-between mb-4">
          <h2 className="text-xl font-black tracking-tight" style={{ 
            fontFamily: "'Outfit', sans-serif",
            color: isDark ? "#fff" : "#000" 
          }}>
            Popular on AP
          </h2>
        </div>
        <div className="flex gap-3 overflow-x-hidden pb-6 px-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="shrink-0 relative flex flex-col" style={{ width: "135px" }}>
              <div className="relative w-full h-[120px] flex items-end justify-end">
                <div className="relative z-10 w-[110px] h-[110px] rounded-md bg-surface border border-black/5 dark:border-white/10 animate-pulse" />
              </div>
              <div className="mt-2 w-[110px] flex justify-center self-end">
                <div className="h-4 w-16 bg-surface border border-black/5 dark:border-white/10 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (popularStories.length === 0) return null;

  return (
    <section className="mt-8 mb-6 relative z-10">
      <div className="px-4 flex items-center justify-between mb-4">
        <h2 className="text-xl font-black tracking-tight" style={{ 
          fontFamily: "'Outfit', sans-serif",
          color: isDark ? "#fff" : "#000" 
        }}>
          Popular on AP
        </h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-6 px-4 snap-x hide-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
        {popularStories.map((story, index) => (
          <div 
            key={story.id} 
            className="snap-start shrink-0 relative flex flex-col cursor-pointer"
            style={{ width: "135px" }}
            onClick={() => navigate({ name: "detail", storyId: story.id })}
          >
            <div className="relative w-full h-[120px] flex items-end justify-end">
              {/* The large background ranking number graphic */}
              <div 
                className="absolute left-[-15px] bottom-[-5px] font-black italic select-none pointer-events-none"
                style={{
                  fontSize: "110px",
                  lineHeight: "0.8",
                  fontFamily: "'Outfit', sans-serif",
                  color: "transparent",
                  WebkitTextStroke: isDark ? "1.5px rgba(255,255,255,0.4)" : "1.5px rgba(0,0,0,0.4)",
                  zIndex: 0
                }}
              >
                {index + 1}
              </div>

              {/* The image card */}
              <div className="relative z-10 w-[110px] h-[110px] rounded-md overflow-hidden shadow-lg border border-black/5 dark:border-white/10 bg-surface">
                <img 
                  src={story.poster || story.image} 
                  alt={story.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Category / Genre below the image */}
            <div className="z-10 mt-2 w-[110px] flex justify-center self-end">
              <span className={cn("text-[12px] font-bold truncate block", isDark ? "text-amber-400" : "text-amber-600")}>
                {story.genre || "Drama"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
