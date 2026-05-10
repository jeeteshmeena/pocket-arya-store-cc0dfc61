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

  if (loading || popularStories.length === 0) return null;

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
            className="snap-start shrink-0 relative flex flex-col items-center cursor-pointer"
            style={{ width: "140px" }}
            onClick={() => navigate({ name: "detail", storyId: story.id })}
          >
            {/* The large background ranking number graphic */}
            <div 
              className="absolute -left-4 -bottom-6 font-black italic select-none pointer-events-none"
              style={{
                fontSize: "120px",
                lineHeight: "1",
                fontFamily: "'Outfit', sans-serif",
                color: "transparent",
                WebkitTextStroke: theme === "cream" ? "1px rgba(0,0,0,0.1)" : "1px rgba(255,255,255,0.15)",
                zIndex: 0
              }}
            >
              {index + 1}
            </div>

            {/* The image card */}
            <div className="relative z-10 w-[110px] aspect-square rounded-xl overflow-hidden shadow-lg border border-white/10" style={{ marginLeft: "20px" }}>
              <img 
                src={story.poster || story.image} 
                alt={story.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Category / Genre below the image */}
            <div className="z-10 mt-3 text-center w-full" style={{ marginLeft: "20px" }}>
              <span className="text-sm font-bold truncate block px-2" style={{ color: theme === "cream" ? "#e67e22" : "#f39c12" }}>
                {story.genre || "Drama"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
