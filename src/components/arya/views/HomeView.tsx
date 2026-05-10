import { HeroSlider } from "../HeroSlider";
import { PopularRow } from "../PopularRow";
import { Row } from "../Row";
import { useApp } from "@/store/app-store";
import { AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Story } from "@/lib/data";

const BASE_URL = "/api";

// ─── Live trending — fetches /api/trending, falls back to local sort ───────────
// Uses ref to avoid re-creating callback on every render
function useLiveTrending(stories: Story[]) {
  const [trending, setTrending] = useState<Story[]>([]);
  const storiesRef = useRef(stories);
  storiesRef.current = stories;

  useEffect(() => {
    if (!stories.length) return; // Wait until stories are loaded

    let cancelled = false;

    const compute = async () => {
      try {
        const res = await fetch(`${BASE_URL}/trending?limit=8`);
        if (!res.ok) throw new Error("non-200");
        const j = await res.json();
        if (!cancelled && j.success && Array.isArray(j.data) && j.data.length >= 1) {
          setTrending(j.data);
          return;
        }
      } catch {}

      // Fallback: sort by purchase_count (real field now from API)
      if (!cancelled) {
        const local = storiesRef.current;
        const hasCounts = local.some(s => (s.purchase_count ?? 0) > 0);
        const sorted = [...local].sort((a, b) => {
          // If no engagement data yet, keep DB insertion order (stable)
          if (!hasCounts) return 0;
          return (b.purchase_count ?? 0) - (a.purchase_count ?? 0);
        });
        setTrending(sorted.slice(0, 8));
      }
    };

    compute();

    // Refresh every 5 min — keeps trending live without hammering server
    const t = setInterval(compute, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [stories.length > 0]); // Only re-run when stories go from empty → loaded

  // Always return something — never empty when stories exist
  const display = trending.length > 0 ? trending : stories.slice(0, 8);
  return display;
}

// ─── New Releases — strictly by date desc ─────────────────────────────────────
function getNewReleases(stories: Story[]): Story[] {
  // Try date-sorted first
  const withDates = stories.filter(s => !!(s.created_at || s.uploaded_at));
  if (withDates.length >= 2) {
    return [...withDates]
      .sort((a, b) => {
        const da = a.created_at || a.uploaded_at || "";
        const db = b.created_at || b.uploaded_at || "";
        return db > da ? 1 : db < da ? -1 : 0;
      })
      .slice(0, 8);
  }
  // No dates in DB yet — show last 8 by DB insertion order (reverse = newest)
  return [...stories].slice(-8).reverse();
}

// ─── Skeleton rows shown while stories load ────────────────────────────────────
function HomeSkeletons() {
  return (
    <div className="space-y-6 px-4 pt-4">
      {/* Hero skeleton — exact 1184:556 ratio, no height:0 trick */}
      <div
        className="w-full rounded-2xl shimmer-bg"
        style={{ aspectRatio: "1184/556" }}
      />
      {[1, 2, 3].map(i => (
        <div key={i} className="space-y-2.5">
          <div className="h-5 w-32 rounded-lg shimmer-bg" />
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3].map(j => (
              <div key={j} className="h-44 w-36 shrink-0 rounded-[14px] shimmer-bg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main view ─────────────────────────────────────────────────────────────────
export function HomeView() {
  const { purchased, stories, storiesLoading, storiesError, reloadStories, theme } = useApp();

  const trending     = useLiveTrending(stories);
  const newReleases  = getNewReleases(stories);
  const genres       = Array.from(new Set(stories.map(s => s.genre).filter(Boolean))).sort();

  if (storiesLoading && stories.length === 0) {
    return <HomeSkeletons />;
  }

  if (storiesError && stories.length === 0) {
    return (
      <div className="px-6 pt-32 text-center">
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
    <div className="pb-6">
      <HeroSlider />
      <PopularRow />
      {purchased.length > 0 && (
        <Row title="Continue Listening" stories={purchased} />
      )}
      {trending.length > 0 && (
        <Row title="Trending Now" stories={trending} wide />
      )}
      {newReleases.length > 0 && (
        <Row
          title={theme === "cream" ? "New & Noteworthy" : "New Releases"}
          stories={newReleases}
        />
      )}
      {genres.map(g => (
        <Row
          key={g}
          title={g}
          stories={stories.filter(s => s.genre === g)}
        />
      ))}
    </div>
  );
}
