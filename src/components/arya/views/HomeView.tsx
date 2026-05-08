import { HeroSlider } from "../HeroSlider";
import { Row } from "../Row";
import { useApp } from "@/store/app-store";
import { AlertCircle } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import type { Story } from "@/lib/data";

const BASE_URL = "/api";

// ── Live trending hook — calls /api/trending which computes real engagement ──
function useLiveTrending(fallbackStories: Story[]) {
  const [trending, setTrending] = useState<Story[]>([]);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/trending?limit=8`);
      const j   = await res.json();
      if (j.success && Array.isArray(j.data) && j.data.length) {
        setTrending(j.data);
        setReady(true);
        return;
      }
    } catch {}

    // Fallback: sort from local stories by purchase_count descending
    if (fallbackStories.length) {
      const sorted = [...fallbackStories].sort((a, b) => {
        const ca = (a.purchase_count ?? 0);
        const cb = (b.purchase_count ?? 0);
        // If all 0 (no data yet), keep DB order
        return cb - ca;
      });
      setTrending(sorted.slice(0, 8));
    }
    setReady(true);
  }, [fallbackStories.map(s => s.id).join(",")]);

  useEffect(() => { load(); }, [load]);

  // Refresh every 5 min to keep trending live
  useEffect(() => {
    const t = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [load]);

  return { trending, ready };
}

// ── New Releases — strictly by created_at desc, no engagement influence ──
function getNewReleases(stories: Story[]): Story[] {
  return [...stories]
    .filter(s => s.created_at || s.uploaded_at)  // Only stories with real dates
    .sort((a, b) => {
      const da = a.created_at || a.uploaded_at || "";
      const db = b.created_at || b.uploaded_at || "";
      // ISO strings sort correctly lexicographically (newer = larger string)
      if (db > da) return 1;
      if (db < da) return -1;
      return 0;
    })
    .slice(0, 8);
}

export function HomeView() {
  const { purchased, stories, storiesLoading, storiesError, reloadStories, theme } = useApp();
  const { trending, ready: trendingReady } = useLiveTrending(stories);

  if (storiesLoading) {
    return (
      <div className="animate-fade-in px-4 pt-4 space-y-8">
        {/* Hero skeleton */}
        <div
          className="w-full rounded-2xl shimmer-bg"
          style={{ paddingBottom: "46.96%", height: 0 }}
        />
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-3">
            <div className="h-5 w-28 rounded-lg shimmer-bg" />
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3].map(j => (
                <div key={j} className="h-40 w-40 shrink-0 rounded-[14px] shimmer-bg" />
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

  // Strict date-sorted new releases
  const newReleases = getNewReleases(stories);

  // Fallback: if no stories have dates, show newest by DB order (last 8)
  const newReleasesDisplay = newReleases.length >= 2
    ? newReleases
    : [...stories].slice(-8).reverse();  // last 8 added to DB

  // Dynamic genre rows (all genres except ones already in main sections)
  const genres = Array.from(new Set(stories.map(s => s.genre).filter(Boolean))).sort();

  return (
    <div className="animate-fade-in pb-20">
      <HeroSlider />
      {purchased.length > 0 && <Row title="Continue" stories={purchased} />}
      <Row
        title="Trending Now"
        stories={trendingReady ? trending : stories.slice(0, 8)}
        wide
      />
      <Row
        title={theme === "cream" ? "New & Noteworthy" : "New Releases"}
        stories={newReleasesDisplay}
      />
      {genres.map(g => (
        <Row key={g} title={g} stories={stories.filter(s => s.genre === g)} />
      ))}
    </div>
  );
}
