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

  return (
    <div className="animate-fade-in">
      <HeroSlider />
      {purchased.length > 0 && <Row title="Continue" stories={purchased} />}
      <Row title="Trending Now" stories={stories.slice(0, 6)} wide />
      <Row title="New Releases" stories={[...stories].reverse().slice(0, 6)} />
      
      {/* Dynamic Categories */}
      {genres.map(g => (
        <Row key={g} title={g} stories={stories.filter((s) => s.genre === g)} />
      ))}
    </div>
  );
}
