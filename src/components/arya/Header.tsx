import { Search, ShoppingBag, X } from "lucide-react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { useRef, useState, useEffect, useMemo } from "react";

function ThemeToggle() {
  const { theme, setTheme } = useApp();
  const isPfm = theme === "pfm";

  return (
    <button
      onClick={() => setTheme(isPfm ? "default" : "pfm")}
      className={cn(
        "relative w-[44px] h-[24px] rounded-full transition-colors duration-300 shrink-0 border border-transparent",
        isPfm ? "bg-foreground" : "bg-border"
      )}
    >
      <div
        className={cn(
          "absolute top-[2px] h-[18px] w-[18px] rounded-full bg-background shadow-sm transition-transform duration-300 grid place-items-center",
          isPfm ? "translate-x-[22px]" : "translate-x-[2px]"
        )}
      >
        <span className={cn("text-[7px] font-bold", isPfm ? "text-foreground" : "text-muted-foreground")}>
          {isPfm ? "PF" : "DF"}
        </span>
      </div>
    </button>
  );
}

export function Header() {
  const { cart, setCartOpen, stories, navigate } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expanded) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
    }
  }, [expanded]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    return stories.filter(s => 
      s.title.toLowerCase().includes(lower) || 
      s.genre?.toLowerCase().includes(lower) || 
      s.platform?.toLowerCase().includes(lower)
    ).slice(0, 6);
  }, [query, stories]);

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="mx-auto max-w-2xl px-4 h-14 flex items-center justify-between gap-3">
          
          {/* Logo - left side */}
          <div className={cn(
            "h-9 grid place-items-center rounded-xl bg-foreground text-background font-display font-extrabold text-sm tracking-tight transition-all duration-300 overflow-hidden shrink-0",
            expanded ? "w-0 opacity-0" : "w-9 opacity-100"
          )}>
            AP
          </div>

          {/* Right section - search expands within this, pushing nothing out */}
          <div className="flex flex-1 items-center justify-end gap-3">
            
            {/* Expanding Search */}
            <div
              className={cn(
                "flex items-center h-9 rounded-full transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-hidden",
                expanded ? "flex-1 bg-surface border border-border shadow-sm px-3" : "w-9 bg-muted border border-transparent justify-center cursor-pointer hover:bg-border/50"
              )}
              onClick={() => !expanded && setExpanded(true)}
            >
              <button 
                className="shrink-0 outline-none"
                onClick={(e) => { e.stopPropagation(); expanded && setExpanded(false); }}
              >
                {expanded ? <X className="h-4 w-4 text-muted-foreground" /> : <Search className="h-4 w-4 text-foreground" />}
              </button>

              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search stories..."
                className={cn(
                  "bg-transparent outline-none text-sm text-foreground transition-all duration-300",
                  expanded ? "w-full opacity-100 ml-2" : "w-0 opacity-0 pointer-events-none ml-0"
                )}
              />
            </div>

            {/* Theme Toggle - stays fixed */}
            <ThemeToggle />

            {/* Cart Button - stays fixed */}
            <button
              id="arya-cart-target"
              onClick={() => setCartOpen(true)}
              className="relative h-9 w-9 grid place-items-center rounded-full bg-muted transition shrink-0 hover:bg-border/50"
            >
              <ShoppingBag className="h-4 w-4 text-foreground" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-foreground text-background text-[10px] font-bold grid place-items-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Live Results Dropdown Overlay */}
      {expanded && query.trim() && (
        <div 
          className="fixed top-14 inset-x-0 bottom-0 z-40 bg-background/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setExpanded(false)}
        >
          <div className="mx-auto max-w-2xl bg-background border-b border-border shadow-md" onClick={e => e.stopPropagation()}>
            {results.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">No results found</div>
            ) : (
              <div className="flex flex-col gap-1 p-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 px-2 pt-1">Top Results</div>
                {results.map(s => (
                  <div 
                    key={s.id} 
                    onClick={() => { setExpanded(false); setQuery(""); navigate({ name: "detail", storyId: s.id }); }}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted active:bg-muted/70 transition cursor-pointer"
                  >
                    <img src={s.poster} alt="" className="h-10 w-10 rounded-md object-cover bg-muted shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate text-foreground">{s.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{s.genre} · ₹{s.price}</div>
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
