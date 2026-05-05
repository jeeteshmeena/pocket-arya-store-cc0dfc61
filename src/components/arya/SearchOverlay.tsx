import { useMemo, useState } from "react";
import { Search, X, Zap } from "lucide-react";
import { useApp } from "@/store/app-store";
import { GENRES, PLATFORMS } from "@/lib/data";
import { cn } from "@/lib/utils";

const PRICES = [
  { label: "All", min: 0, max: Infinity },
  { label: "< ₹100", min: 0, max: 99 },
  { label: "₹100-200", min: 100, max: 200 },
  { label: "> ₹200", min: 201, max: Infinity },
];

export function SearchOverlay() {
  const { searchOpen, setSearchOpen, navigate, startCheckout, stories } = useApp();
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string | null>(null);
  const [price, setPrice] = useState(PRICES[0]);

  const results = useMemo(() => {
    return stories.filter((s) => {
      if (q && !s.title.toLowerCase().includes(q.toLowerCase())) return false;
      if (genre && s.genre !== genre) return false;
      if (platform && s.platform !== platform) return false;
      if (s.price < price.min || s.price > price.max) return false;
      return true;
    });
  }, [stories, q, genre, platform, price]);

  if (!searchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background animate-fade-in flex flex-col">
      <div className="h-14 px-3 flex items-center gap-2 border-b border-border">
        <button onClick={() => setSearchOpen(false)} className="h-9 w-9 grid place-items-center rounded-full hover:bg-surface">
          <X className="h-5 w-5" />
        </button>
        <div className="flex-1 h-10 flex items-center gap-2 px-3 rounded-full bg-surface">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search stories"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
        </div>
      </div>
      <div className="px-4 py-3 space-y-2 border-b border-border">
        <Filter label="Platform" options={PLATFORMS} value={platform} onChange={setPlatform} />
        <Filter label="Genre" options={GENRES} value={genre} onChange={setGenre} />
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {PRICES.map((p) => (
            <button key={p.label} onClick={() => setPrice(p)} className={cn(
              "shrink-0 h-8 px-3 rounded-full text-xs border transition",
              price.label === p.label ? "bg-primary text-primary-foreground border-primary" : "bg-surface border-border text-muted-foreground"
            )}>{p.label}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
        {results.length === 0 && (
          <div className="text-center text-sm text-muted-foreground pt-16">No results</div>
        )}
        {results.map((s) => (
          <div key={s.id} className="flex gap-3 p-2 rounded-xl bg-surface" onClick={() => { setSearchOpen(false); navigate({ name: "detail", storyId: s.id }); }}>
            <img src={s.poster} alt={s.title} className="h-14 w-14 rounded-lg object-cover" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{s.title}</div>
              <div className="text-xs text-muted-foreground">{s.genre} · {s.platform}</div>
              <div className="text-sm font-semibold mt-0.5">₹{s.price}</div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setSearchOpen(false); startCheckout([s]); }}
              className="self-center h-9 px-3 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1"
            >
              <Zap className="h-3 w-3" /> Buy
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Filter({ label, options, value, onChange }: { label: string; options: string[]; value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground shrink-0">{label}</span>
      <button onClick={() => onChange(null)} className={cn(
        "shrink-0 h-7 px-2.5 rounded-full text-xs border transition",
        !value ? "bg-foreground text-background border-foreground" : "bg-surface border-border text-muted-foreground"
      )}>All</button>
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} className={cn(
          "shrink-0 h-7 px-2.5 rounded-full text-xs border transition",
          value === o ? "bg-foreground text-background border-foreground" : "bg-surface border-border text-muted-foreground"
        )}>{o}</button>
      ))}
    </div>
  );
}
