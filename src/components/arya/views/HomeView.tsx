import { HeroSlider } from "../HeroSlider";
import { Row } from "../Row";
import { useApp } from "@/store/app-store";
import { AlertCircle } from "lucide-react";

export function HomeView() {
  const { purchased, stories, storiesLoading, storiesError, reloadStories, theme } = useApp();

  if (storiesLoading) {
    return (
      <div className="animate-fade-in px-4 pt-4 space-y-8">
        <div className="h-48 w-full rounded-2xl bg-muted animate-pulse" />
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-3">
            <div className="h-5 w-28 rounded bg-muted animate-pulse" />
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3].map(j => (
                <div key={j} className="h-40 w-40 shrink-0 rounded-xl bg-muted animate-pulse" />
              ))}
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

  // ── Real trending: sort by purchase_count / downloads desc ──
  const trending = [...stories]
    .sort((a, b) => {
      const ca = (a as any).purchase_count ?? (a as any).downloads ?? 0;
      const cb = (b as any).purchase_count ?? (b as any).downloads ?? 0;
      return cb - ca;
    })
    .slice(0, 8);

  // ── Real new releases: sort by created_at / uploaded_at desc ──
  const newReleases = [...stories]
    .sort((a, b) => {
      const da = (a as any).created_at ?? (a as any).uploaded_at ?? "";
      const db = (b as any).created_at ?? (b as any).uploaded_at ?? "";
      return db > da ? 1 : db < da ? -1 : 0;
    })
    .slice(0, 8);

  // ── Dynamic genre rows ──
  const genres = Array.from(new Set(stories.map((s) => s.genre).filter(Boolean))).sort();

  return (
    <div className="animate-fade-in pb-20">
      <HeroSlider />
      {purchased.length > 0 && <Row title="Continue" stories={purchased} />}
      <Row title="Trending Now" stories={trending} wide />
      <Row title={theme === "cream" ? "New & Noteworthy" : "New Releases"} stories={newReleases} />
      {genres.map(g => (
        <Row key={g} title={g} stories={stories.filter((s) => s.genre === g)} />
      ))}
    </div>
  );
}
