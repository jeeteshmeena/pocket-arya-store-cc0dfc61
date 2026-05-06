import { HeroSlider } from "../HeroSlider";
import { Row } from "../Row";
import { useApp } from "@/store/app-store";
import { Loader2, AlertCircle } from "lucide-react";

export function HomeView() {
  const { purchased, stories, storiesLoading, storiesError, reloadStories } = useApp();

  if (storiesLoading) {
    return (
      <div className="animate-fade-in px-4 pt-4 space-y-8">
        {/* Hero Skeleton */}
        <div className="h-48 w-full rounded-2xl bg-muted animate-pulse"></div>
        
        {/* Rows Skeleton */}
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-3">
            <div className="h-6 w-32 rounded bg-muted animate-pulse"></div>
            <div className="flex gap-3 overflow-hidden">
              <div className="h-40 w-40 shrink-0 rounded-2xl bg-muted animate-pulse"></div>
              <div className="h-40 w-40 shrink-0 rounded-2xl bg-muted animate-pulse"></div>
              <div className="h-40 w-40 shrink-0 rounded-2xl bg-muted animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (storiesError) {
    return (
      <div className="animate-fade-in px-6 pt-32 text-center">
        <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
        <p className="text-sm mt-3 text-muted-foreground">{storiesError}</p>
        <button
          onClick={reloadStories}
          className="mt-4 h-10 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  // Extract dynamic categories (genres) from available stories
  const genres = Array.from(new Set(stories.map((s) => s.genre).filter(Boolean))).sort();
  const { theme } = useApp();

  return (
    <div className="animate-fade-in pb-24">
      {theme === "cream" ? (
        <div className="px-4 pt-4 pb-6 space-y-6">
          <div>
            <h1 className="text-4xl font-display font-extrabold text-foreground tracking-tight">Hello, Jenny</h1>
            <p className="text-[15px] font-medium text-muted-foreground mt-1">Which book you want to listen today ?</p>
          </div>
          
          <div className="neo-card bg-[#CCE5FF] p-4 flex items-center justify-between overflow-hidden relative min-h-[140px]">
            {/* Background elements to match image style if needed, or just solid */}
            <div className="relative z-10 w-[45%]">
              {/* placeholder for girl with headphones */}
              <img src="https://images.unsplash.com/photo-1516280440502-6c5617a23c34?q=80&w=300&auto=format&fit=crop" className="absolute -top-16 -left-4 w-32 h-32 object-cover rounded-full border-2 border-black" alt="Listening" />
            </div>
            <div className="relative z-10 w-[55%] text-right flex flex-col items-end justify-center">
              <h2 className="text-xl font-display font-extrabold text-black uppercase leading-tight mb-1">Trending</h2>
              <p className="text-xs font-semibold text-black/80 mb-3">{stories.length} Interesting Books</p>
              <button className="neo-button bg-white text-black px-6 py-2 text-sm">
                Explore
              </button>
            </div>
          </div>
        </div>
      ) : (
        <HeroSlider />
      )}

      {purchased.length > 0 && <Row title="Continue" stories={purchased} />}
      {theme !== "cream" && <Row title="Trending Now" stories={stories.slice(0, 6)} wide />}
      <Row title="New & Noteworthy" stories={[...stories].reverse().slice(0, 6)} />
      
      {/* Dynamic Categories */}
      {genres.map(g => (
        <Row key={g} title={g} stories={stories.filter((s) => s.genre === g)} />
      ))}
    </div>
  );
}
