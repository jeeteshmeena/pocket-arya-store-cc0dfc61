import { HeroSlider } from "../HeroSlider";
import { Row } from "../Row";
import { useApp } from "@/store/app-store";
import { Loader2, AlertCircle } from "lucide-react";

export function HomeView() {
  const { purchased, stories, storiesLoading, storiesError, reloadStories } = useApp();

  if (storiesLoading) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center pt-32 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm mt-3">Loading stories…</p>
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

  return (
    <div className="animate-fade-in">
      <HeroSlider />
      {purchased.length > 0 && <Row title="Continue" stories={purchased} />}
      <Row title="Trending Now" stories={stories.slice(0, 6)} wide />
      <Row title="New Releases" stories={[...stories].reverse().slice(0, 6)} />
      <Row title="Horror" stories={stories.filter((s) => s.genre === "Horror")} />
      <Row title="Thriller & Crime" stories={stories.filter((s) => ["Thriller", "Crime"].includes(s.genre))} />
    </div>
  );
}
