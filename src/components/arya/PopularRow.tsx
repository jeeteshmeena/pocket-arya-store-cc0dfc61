import { useEffect, useState } from "react";
import { useApp } from "@/store/app-store";
import { StoryCard } from "./StoryCard";

export function PopularRow() {
  const { theme, navigate } = useApp();
  const [popularStories, setPopularStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
            color: theme === "cream" ? "#000" : "#fff" 
          }}>
            Popular on AP
          </h2>
        </div>
        <div className="flex gap-4 overflow-x-hidden pb-6 px-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="shrink-0 relative flex flex-col" style={{ width: "165px" }}>
              <div className="relative w-full h-[150px] flex items-end justify-end">
                <div className="relative z-10 w-[130px] h-[130px] rounded-lg bg-surface animate-pulse" />
              </div>
              <div className="mt-2 w-[130px] flex justify-center self-end">
                <div className="h-4 w-16 bg-surface animate-pulse rounded" />
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
          color: theme === "cream" ? "#000" : "#fff" 
        }}>
          Popular on AP
        </h2>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6 px-4 snap-x hide-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
        {popularStories.map((story, index) => (
          <div 
            key={story.id} 
            className="snap-start shrink-0 relative flex flex-col cursor-pointer"
            style={{ width: "165px" }}
            onClick={() => navigate({ name: "detail", storyId: story.id })}
          >
            <div className="relative w-full h-[150px] flex items-end justify-end">
              {/* The large background ranking number graphic */}
              <div 
                className="absolute left-[5px] bottom-[-20px] font-black italic select-none pointer-events-none"
                style={{
                  fontSize: "140px",
                  lineHeight: "1",
                  fontFamily: "'Outfit', sans-serif",
                  color: "transparent",
                  WebkitTextStroke: theme === "cream" ? "2px rgba(0,0,0,0.25)" : "2px rgba(255,255,255,0.25)",
                  zIndex: 0
                }}
              >
                {index + 1}
              </div>

              {/* The image card */}
              <div className="relative z-10 w-[130px] h-[130px] rounded-lg overflow-hidden shadow-lg border border-black/5 dark:border-white/10 bg-surface">
                <img 
                  src={story.poster || story.image} 
                  alt={story.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Category / Genre below the image */}
            <div className="z-10 mt-2 w-[130px] flex justify-center self-end">
              <span className="text-[13px] font-bold truncate block" style={{ color: theme === "cream" ? "#e67e22" : "#f39c12" }}>
                {story.genre || "Drama"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
