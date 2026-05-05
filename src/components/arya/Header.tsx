import { Search, ShoppingCart, X } from "lucide-react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { useRef, useState, useEffect } from "react";

/* ── iOS-style theme toggle ──────────────────────────────────────────
   Single pill with sliding white knob. Click cycles Default ↔ PFM.
   ─────────────────────────────────────────────────────────────────── */
function ThemeToggle() {
  const { theme, setTheme } = useApp();
  const isPfm = theme === "pfm";

  return (
    <button
      onClick={() => setTheme(isPfm ? "default" : "pfm")}
      aria-label={`Switch to ${isPfm ? "Default" : "PFM"} theme`}
      className="flex items-center gap-1.5 shrink-0 select-none"
    >
      {/* Track */}
      <div
        className="relative w-11 h-6 rounded-full transition-colors duration-300"
        style={{ backgroundColor: isPfm ? "#111111" : "#D1D5DB" }}
      >
        {/* Knob */}
        <div
          className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-300"
          style={{ left: isPfm ? "calc(100% - 20px)" : "4px" }}
        />
      </div>
      {/* Label */}
      <span
        className="text-[10px] font-bold uppercase tracking-wider w-7 transition-colors duration-200"
        style={{ color: isPfm ? "#111111" : "#9CA3AF" }}
      >
        {isPfm ? "PFM" : "DEF"}
      </span>
    </button>
  );
}

/* ── Header ─────────────────────────────────────────────────────────
   Search: compact icon — expands inline with animation on click.
   ─────────────────────────────────────────────────────────────────── */
export function Header() {
  const { cart, setCartOpen, setSearchOpen } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus when expanded, clear when collapsed
  useEffect(() => {
    if (expanded) {
      setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      setQuery("");
    }
  }, [expanded]);

  const collapse = () => setExpanded(false);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") { collapse(); return; }
    if (e.key === "Enter") {
      collapse();
      setSearchOpen(true);
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-background border-b border-border">
      <div className="mx-auto max-w-2xl px-4 h-14 flex items-center gap-2">

        {/* Logo — shrinks out when search expands */}
        <div
          className="grid place-items-center rounded-xl bg-foreground text-background font-display font-extrabold text-sm tracking-tight shrink-0 overflow-hidden transition-all duration-300"
          style={{ width: expanded ? 0 : 36, height: 36, opacity: expanded ? 0 : 1, marginRight: expanded ? 0 : undefined }}
          aria-hidden={expanded}
        >
          AP
        </div>

        {/* Search bar — expands from icon to full-width pill */}
        <div
          className={cn(
            "flex items-center gap-2 h-9 rounded-full bg-muted overflow-hidden transition-all duration-300 ease-in-out",
            expanded ? "flex-1 px-3" : "w-9 px-0 justify-center cursor-pointer"
          )}
          onClick={() => !expanded && setExpanded(true)}
          role={!expanded ? "button" : undefined}
          aria-label={!expanded ? "Open search" : undefined}
        >
          {/* Icon — always visible */}
          <button
            onClick={(e) => { e.stopPropagation(); expanded ? collapse() : setExpanded(true); }}
            className="shrink-0"
            tabIndex={expanded ? -1 : 0}
            aria-label={expanded ? "Close search" : "Search"}
          >
            {expanded
              ? <X className="h-4 w-4 text-muted-foreground" />
              : <Search className="h-4 w-4 text-muted-foreground" />
            }
          </button>

          {/* Expanding input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search stories…"
            tabIndex={expanded ? 0 : -1}
            className={cn(
              "bg-transparent outline-none text-sm placeholder:text-muted-foreground text-foreground transition-all duration-300",
              expanded ? "flex-1 opacity-100" : "w-0 opacity-0 pointer-events-none"
            )}
          />

          {/* "Search" hint when query present */}
          {expanded && query.trim() && (
            <button
              onMouseDown={(e) => { e.preventDefault(); collapse(); setSearchOpen(true); }}
              className="shrink-0 text-[11px] font-bold text-foreground px-2 py-0.5 rounded-full bg-foreground/10 whitespace-nowrap"
            >
              Go
            </button>
          )}
        </div>

        {/* Theme toggle (iOS style) — hides when search open */}
        <div
          className="transition-all duration-300 overflow-hidden shrink-0"
          style={{ width: expanded ? 0 : undefined, opacity: expanded ? 0 : 1 }}
        >
          <ThemeToggle />
        </div>

        {/* Cart */}
        <button
          id="arya-cart-target"
          onClick={() => setCartOpen(true)}
          className="relative h-9 w-9 grid place-items-center rounded-full bg-muted border border-border active:scale-90 transition shrink-0"
          aria-label="Cart"
        >
          <ShoppingCart className="h-4 w-4 text-foreground" />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-foreground text-background text-[10px] font-bold grid place-items-center">
              {cart.length}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
