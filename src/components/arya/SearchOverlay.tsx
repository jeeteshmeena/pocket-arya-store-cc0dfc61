import { useMemo, useState, useEffect, useRef } from "react";
import { Search, X, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

// ── Dynamic filter options from actual story data ─────────────────
function useFilterOptions(stories: ReturnType<typeof useApp>["stories"]) {
  return useMemo(() => {
    const genres   = [...new Set(stories.map((s) => s.genre).filter(Boolean))].sort();
    const platforms = [...new Set(stories.map((s) => s.platform).filter(Boolean))].sort();
    return { genres, platforms };
  }, [stories]);
}

const PRICE_BUCKETS = [
  { label: "Any Price",   min: 0,   max: Infinity },
  { label: "Under ₹100", min: 0,   max: 99 },
  { label: "₹100–200",   min: 100, max: 200 },
  { label: "₹200+",      min: 201, max: Infinity },
];

const STATUS_OPTS = [
  { label: "All",       value: null as null | boolean },
  { label: "Completed", value: true },
  { label: "Ongoing",   value: false },
];

/* ── Premium chip row ─────────────────────────────────────────────── */
function ChipRow<T extends string | null | boolean>({
  options,
  value,
  onChange,
  keyOf,
  labelOf,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
  keyOf?: (o: { label: string; value: T }) => string;
  labelOf?: (o: { label: string; value: T }) => string;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
      {options.map((o) => {
        const active = o.value === value;
        const key = keyOf ? keyOf(o) : String(o.value ?? "null");
        return (
          <button
            key={key}
            onClick={() => onChange(o.value)}
            className={cn(
              "shrink-0 h-8 px-4 text-[12px] font-semibold transition-all duration-200 whitespace-nowrap",
              "border rounded-full",
              active
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
            )}
          >
            {labelOf ? labelOf(o) : o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Section label ────────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
      {children}
    </div>
  );
}

/* ── Story result row ─────────────────────────────────────────────── */
function ResultRow({ story, onOpen, onBuy }: {
  story: ReturnType<typeof useApp>["stories"][0];
  onOpen: () => void;
  onBuy: () => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const src = story.poster?.startsWith("http") || story.poster?.startsWith("/api/image/") ? story.poster : null;
  return (
    <div
      onClick={onOpen}
      className="flex gap-3 items-center py-3 border-b border-border last:border-0 cursor-pointer active:bg-muted/50 transition-colors px-1 -mx-1 rounded-lg"
    >
      {/* Thumb */}
      <div className="h-14 w-14 rounded-lg overflow-hidden bg-muted shrink-0">
        {src && !imgErr ? (
          <img src={src} alt={story.title} className="h-full w-full object-cover" onError={() => setImgErr(true)} />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <span className="text-[8px] text-muted-foreground font-semibold text-center px-1 leading-tight line-clamp-3">
              {story.title.slice(0, 20)}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate">{story.title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {[story.platform, story.genre].filter(Boolean).join(" · ")}
        </div>
        {/* Status pill */}
        <div className="flex items-center gap-1.5 mt-1">
          <span className={cn(
            "text-[10px] font-semibold",
            story.isCompleted ? "text-emerald-600" : "text-amber-600"
          )}>
            {story.isCompleted ? "● Completed" : "● Ongoing"}
          </span>
        </div>
      </div>

      {/* Price + Buy */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-sm font-bold">₹{story.price}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onBuy(); }}
          className="h-7 px-3 rounded-full bg-foreground text-background text-[11px] font-bold active:scale-95 transition"
        >
          Buy
        </button>
      </div>
    </div>
  );
}


export function SearchOverlay() {
  const { searchOpen, setSearchOpen, navigate, goToCheckout, addToCart, stories } = useApp();
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string | null>(null);
  const [priceIdx, setPriceIdx] = useState(0);
  const [statusFilter, setStatusFilter] = useState<null | boolean>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { genres, platforms } = useFilterOptions(stories);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setFiltersOpen(false);
    }
  }, [searchOpen]);

  const price = PRICE_BUCKETS[priceIdx];

  const results = useMemo(() => {
    return stories.filter((s) => {
      if (q && !s.title.toLowerCase().includes(q.toLowerCase())) return false;
      if (genre && s.genre !== genre) return false;
      if (platform && s.platform !== platform) return false;
      if (s.price < price.min || s.price > price.max) return false;
      if (statusFilter !== null && s.isCompleted !== statusFilter) return false;
      return true;
    });
  }, [stories, q, genre, platform, price, statusFilter]);

  // Active filter count (excluding query)
  const activeFilters = [genre, platform, priceIdx !== 0 ? "p" : null, statusFilter !== null ? "s" : null].filter(Boolean).length;

  if (!searchOpen) return null;

  const clearAll = () => { setGenre(null); setPlatform(null); setPriceIdx(0); setStatusFilter(null); };

  return (
    <div className="fixed inset-0 z-[55] bg-background flex flex-col animate-slide-up-full">

      {/* ── Search bar header ─────────────────────────── */}
      <div className="h-14 px-4 flex items-center gap-3 border-b border-border shrink-0">
        <button
          onClick={() => setSearchOpen(false)}
          className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted transition shrink-0"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex-1 h-10 flex items-center gap-2 px-4 rounded-full bg-muted">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search stories, genre, platform…"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
          {q && (
            <button onClick={() => setQ("")} className="shrink-0">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Filter toggle — shows active count badge */}
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className={cn(
            "relative h-9 w-9 grid place-items-center rounded-full border transition shrink-0",
            filtersOpen || activeFilters > 0
              ? "bg-foreground text-background border-foreground"
              : "bg-transparent text-muted-foreground border-border hover:border-foreground"
          )}
          aria-label="Filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilters > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-foreground text-background text-[9px] font-bold grid place-items-center border-2 border-background">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* ── Filter panel — slides in/out ──────────────── */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 border-b border-border bg-surface shrink-0",
          filtersOpen ? "max-h-72 py-4 px-4" : "max-h-0 py-0"
        )}
      >
        <div className="space-y-4">
          {/* Platform */}
          <div>
            <SectionLabel>Platform</SectionLabel>
            <ChipRow
              options={[{ label: "All", value: null as null | string }, ...platforms.map((p) => ({ label: p, value: p }))]}
              value={platform}
              onChange={setPlatform}
              keyOf={(o) => o.label}
            />
          </div>

          {/* Genre */}
          <div>
            <SectionLabel>Genre</SectionLabel>
            <ChipRow
              options={[{ label: "All", value: null as null | string }, ...genres.map((g) => ({ label: g, value: g }))]}
              value={genre}
              onChange={setGenre}
              keyOf={(o) => o.label}
            />
          </div>

          {/* Price */}
          <div>
            <SectionLabel>Price</SectionLabel>
            <ChipRow
              options={PRICE_BUCKETS.map((p, i) => ({ label: p.label, value: i }))}
              value={priceIdx}
              onChange={setPriceIdx}
              keyOf={(o) => o.label}
            />
          </div>

          {/* Status */}
          <div>
            <SectionLabel>Status</SectionLabel>
            <ChipRow
              options={STATUS_OPTS}
              value={statusFilter}
              onChange={setStatusFilter}
              keyOf={(o) => o.label}
            />
          </div>
        </div>

        {/* Clear all */}
        {activeFilters > 0 && (
          <button
            onClick={clearAll}
            className="mt-3 text-xs font-semibold text-muted-foreground underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* ── Results ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-2 pb-6" style={{ WebkitOverflowScrolling: "touch" }}>
        {/* Result count */}
        <div className="text-[11px] text-muted-foreground py-2">
          {q || activeFilters > 0
            ? `${results.length} result${results.length !== 1 ? "s" : ""}`
            : `${stories.length} stories`}
        </div>

        {results.length === 0 && (
          <div className="text-center pt-16">
            <div className="h-12 w-12 rounded-full bg-muted grid place-items-center mx-auto">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">No stories match your search</p>
            {activeFilters > 0 && (
              <button onClick={clearAll} className="mt-2 text-sm font-semibold text-foreground underline">
                Clear filters
              </button>
            )}
          </div>
        )}

        {results.map((s) => (
          <ResultRow
            key={s.id}
            story={s}
            onOpen={() => { setSearchOpen(false); navigate({ name: "detail", storyId: s.id }); }}
            onBuy={() => {
              addToCart(s);
              setSearchOpen(false);
              goToCheckout();
            }}
          />
        ))}
      </div>
    </div>
  );
}
