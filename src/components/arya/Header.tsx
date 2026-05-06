import { Search, ShoppingCart, Palette, ArrowLeft, Clock, X } from "lucide-react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect, useMemo } from "react";
import { haptics } from "@/lib/haptics";

function ThemeCycle() {
  const { theme, setTheme } = useApp();
  const THEMES = ["default", "pfm", "dark", "teal", "cream"];
  
  const handleCycle = () => {
    haptics.light();
    const idx = THEMES.indexOf(theme);
    setTheme(THEMES[(idx + 1) % THEMES.length] as any);
  };

  return (
    <button
      onClick={handleCycle}
      className="relative h-9 w-9 grid place-items-center rounded-full bg-muted transition-all shrink-0 hover:bg-border/50 active:scale-95"
      aria-label="Cycle Theme"
    >
      <Palette className="h-4 w-4 text-foreground" />
    </button>
  );
}

export function Header() {
  const { cart, setCartOpen, stories, navigate } = useApp();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("recent_searches") || "[]");
      setRecent(saved.slice(0, 5));
    } catch {}
  }, []);

  const saveSearch = (q: string) => {
    if (!q.trim()) return;
    const next = [q.trim(), ...recent.filter((x) => x.toLowerCase() !== q.trim().toLowerCase())].slice(0, 5);
    setRecent(next);
    localStorage.setItem("recent_searches", JSON.stringify(next));
  };

  const handleOpen = () => {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleClose = () => {
    setSearchOpen(false);
    setQuery("");
  };

  const goToDetail = (id: string, searchTerm?: string) => {
    if (searchTerm) saveSearch(searchTerm);
    handleClose();
    navigate({ name: "detail", storyId: id });
  };

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return stories.filter(s => s.title.toLowerCase().includes(q) || s.genre?.toLowerCase().includes(q)).slice(0, 6);
  }, [query, stories]);

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="mx-auto max-w-2xl px-4 h-14 flex items-center justify-between gap-3 relative">
          
          {/* Default State */}
          <div className={cn("flex items-center w-full justify-between gap-3 transition-opacity duration-200", searchOpen ? "opacity-0 pointer-events-none" : "opacity-100")}>
            <div className={cn(
              "h-9 w-9 grid place-items-center font-display font-extrabold text-sm tracking-tight shrink-0 shadow-sm",
              useApp().theme === "cream" ? "rounded-xl border-2 border-black bg-white text-black shadow-[2px_2px_0px_#000]" : "rounded-xl bg-foreground text-background"
            )}>
              AP
            </div>
            
            <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
              <button
                onClick={handleOpen}
                className={cn(
                  "flex flex-1 max-w-[180px] items-center gap-2 h-9 px-3 active:scale-[0.98] transition",
                  useApp().theme === "cream" 
                    ? "neo-button bg-white text-black" 
                    : "rounded-full bg-surface border border-border shadow-sm hover:bg-muted"
                )}
              >
                <Search className={cn("h-4 w-4 shrink-0", useApp().theme === "cream" ? "text-black" : "text-muted-foreground")} />
                <span className={cn("text-sm truncate", useApp().theme === "cream" ? "text-black font-semibold" : "text-muted-foreground")}>Search...</span>
              </button>

              <ThemeCycle />

              <button
                id="arya-cart-target"
                onClick={() => setCartOpen(true)}
                className={cn(
                  "relative h-9 w-9 grid place-items-center transition-all shrink-0 active:scale-95",
                  useApp().theme === "cream"
                    ? "rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_#000]"
                    : "rounded-full bg-muted hover:bg-border/50"
                )}
              >
                <ShoppingCart className="h-4 w-4 text-foreground" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-foreground text-background text-[10px] font-bold grid place-items-center border-2 border-background">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Expanded State (YouTube Style) */}
          <div className={cn(
            "absolute inset-0 px-2 flex items-center gap-1 bg-background transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
            searchOpen ? "translate-x-0" : "translate-x-full"
          )}>
            <button onClick={handleClose} className="h-10 w-10 grid place-items-center rounded-full active:bg-muted shrink-0 transition">
              <ArrowLeft className="h-[22px] w-[22px] text-foreground" />
            </button>
            
            <div className="flex-1 h-10 rounded-full bg-muted flex items-center px-3 border border-transparent focus-within:border-border transition-colors">
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search stories..."
                className="flex-1 bg-transparent outline-none text-[15px]"
                onKeyDown={e => {
                  if (e.key === "Enter" && query.trim()) {
                    saveSearch(query);
                    // could just show results below, no need to navigate away
                  }
                }}
              />
              {query && (
                <button onClick={() => { setQuery(""); inputRef.current?.focus(); }} className="shrink-0 p-1 active:scale-90 transition-transform">
                  <X className="h-[18px] w-[18px] text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search Overlay Content */}
      {searchOpen && (
        <div className="fixed top-14 inset-x-0 bottom-0 z-40 bg-background flex flex-col overflow-y-auto animate-fade-in pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto max-w-2xl w-full p-4">
            
            {!query.trim() && recent.length > 0 && (
              <div className="mb-6 animate-fade-in">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">Recent Searches</h3>
                <div className="space-y-1">
                  {recent.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => setQuery(r)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl active:bg-muted transition"
                    >
                      <Clock className="h-[18px] w-[18px] text-muted-foreground" />
                      <span className="text-[15px] font-medium flex-1 text-left text-foreground">{r}</span>
                      <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-[135deg]" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {query.trim() && suggestions.length === 0 && (
              <div className="text-center py-12 text-[15px] text-muted-foreground animate-fade-in">No results found for "{query}"</div>
            )}

            {query.trim() && suggestions.length > 0 && (
              <div className="space-y-1 animate-fade-in">
                {suggestions.map(s => (
                  <div 
                    key={s.id}
                    onClick={() => goToDetail(s.id, s.title)}
                    className="flex items-center gap-3 p-3 rounded-2xl active:bg-muted transition cursor-pointer"
                  >
                    <Search className="h-[18px] w-[18px] text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-medium truncate text-foreground">{s.title}</div>
                      <div className="text-[13px] text-muted-foreground truncate">{s.genre}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
