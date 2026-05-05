import { useState, useMemo } from "react";
import { StoryCard } from "../StoryCard";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { haptics } from "@/lib/haptics";

const PRICES = [
  { label: "Any", min: 0, max: Infinity },
  { label: "< ₹100", min: 0, max: 99 },
  { label: "₹100–200", min: 100, max: 200 },
  { label: "₹200+", min: 201, max: Infinity },
];

const STATUS = [
  { label: "All", value: null },
  { label: "Completed", value: true },
  { label: "Ongoing", value: false },
];

export function ExploreView() {
  const { stories } = useApp();
  const [q, setQ] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  
  // Filters
  const [genre, setGenre] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string | null>(null);
  const [priceIdx, setPriceIdx] = useState(0);
  const [status, setStatus] = useState<boolean | null>(null);

  const genres = useMemo(() => Array.from(new Set(stories.map(s => s.genre).filter(Boolean))).sort(), [stories]);
  const platforms = useMemo(() => Array.from(new Set(stories.map(s => s.platform).filter(Boolean))).sort(), [stories]);

  const activeCount = [genre, platform, priceIdx !== 0 ? true : null, status !== null ? true : null].filter(Boolean).length;

  const list = useMemo(() => {
    return stories.filter(s => {
      if (q && !s.title.toLowerCase().includes(q.toLowerCase())) return false;
      if (genre && s.genre !== genre) return false;
      if (platform && s.platform !== platform) return false;
      if (status !== null && s.isCompleted !== status) return false;
      const p = PRICES[priceIdx];
      if (s.price < p.min || s.price > p.max) return false;
      return true;
    });
  }, [stories, q, genre, platform, priceIdx, status]);

  const toggleFilter = () => {
    haptics.light();
    setFilterOpen(!filterOpen);
  };

  return (
    <div className="animate-fade-in flex flex-col min-h-full">
      {/* Top Bar: Search + Filter */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-3 py-3 border-b border-border flex items-center gap-2">
        <div className="flex-1 h-10 rounded-full bg-surface border border-border flex items-center px-3 focus-within:border-foreground transition-colors shadow-sm">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search explore..."
            className="flex-1 bg-transparent outline-none text-[15px] ml-2 text-foreground placeholder:text-muted-foreground"
          />
          {q && (
            <button onClick={() => setQ("")} className="shrink-0 p-1 active:scale-90 transition">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        
        <button
          onClick={toggleFilter}
          className={cn(
            "relative h-10 px-4 rounded-full border shadow-sm font-semibold text-[13px] flex items-center gap-2 transition active:scale-95",
            activeCount > 0 
              ? "bg-foreground text-background border-foreground" 
              : "bg-surface border-border text-foreground hover:bg-muted"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold grid place-items-center">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 p-[12px]">
        <div className="grid grid-cols-2 gap-[12px]">
          {list.map(s => (
            <div key={s.id} className="w-full">
              <StoryCard story={s} wide />
            </div>
          ))}
        </div>
        {list.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-[15px]">
            No stories found.
          </div>
        )}
      </div>

      {/* Filter Bottom Sheet */}
      {filterOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in" 
            onClick={() => setFilterOpen(false)} 
          />
          <div className="fixed bottom-0 inset-x-0 z-50 bg-[#F5F5F7] rounded-t-[20px] shadow-2xl animate-slide-up-full flex flex-col pb-[env(safe-area-inset-bottom)]">
            <div className="p-4 flex items-center justify-between bg-surface rounded-t-[20px] border-b border-border">
              <h2 className="font-display font-bold text-lg text-foreground">Filters</h2>
              <button onClick={() => setFilterOpen(false)} className="h-8 w-8 grid place-items-center rounded-full bg-muted active:scale-90 transition">
                <X className="h-5 w-5 text-foreground" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh] space-y-6">
              
              {/* Platform */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Platform</h3>
                <div className="flex flex-wrap gap-2">
                  <Chip active={platform === null} onClick={() => { haptics.light(); setPlatform(null); }}>All</Chip>
                  {platforms.map(p => (
                    <Chip key={p} active={platform === p} onClick={() => { haptics.light(); setPlatform(p); }}>{p}</Chip>
                  ))}
                </div>
              </div>

              {/* Genre */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Genre</h3>
                <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
                  <Chip active={genre === null} onClick={() => { haptics.light(); setGenre(null); }}>All</Chip>
                  {genres.map(g => (
                    <Chip key={g} active={genre === g} onClick={() => { haptics.light(); setGenre(g); }}>{g}</Chip>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Price</h3>
                <div className="flex bg-muted p-1 rounded-xl">
                  {PRICES.map((p, i) => (
                    <button
                      key={p.label}
                      onClick={() => { haptics.light(); setPriceIdx(i); }}
                      className={cn(
                        "flex-1 py-2 text-[13px] font-semibold rounded-lg transition-all",
                        priceIdx === i ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Status</h3>
                <div className="flex bg-muted p-1 rounded-xl">
                  {STATUS.map(s => (
                    <button
                      key={s.label}
                      onClick={() => { haptics.light(); setStatus(s.value); }}
                      className={cn(
                        "flex-1 py-2 text-[13px] font-semibold rounded-lg transition-all",
                        status === s.value ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            <div className="p-4 bg-surface border-t border-border flex gap-3">
              <button 
                onClick={() => { haptics.medium(); setGenre(null); setPlatform(null); setPriceIdx(0); setStatus(null); }}
                className="h-[52px] px-6 rounded-2xl font-bold text-[15px] bg-muted text-foreground active:scale-95 transition"
              >
                Reset
              </button>
              <button 
                onClick={() => { haptics.success(); setFilterOpen(false); }}
                className="flex-1 h-[52px] rounded-2xl font-bold text-[15px] bg-foreground text-background active:scale-[0.98] transition shadow-md"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Chip({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={cn(
      "shrink-0 h-[34px] px-4 rounded-full text-[13px] font-semibold border transition-all duration-200 active:scale-95",
      active 
        ? "bg-foreground text-background border-foreground" 
        : "bg-surface border-border text-foreground hover:bg-muted"
    )}>
      {children}
    </button>
  );
}
