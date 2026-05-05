import { Search, ShoppingCart } from "lucide-react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

export function Header() {
  const { cart, setCartOpen, setSearchOpen, theme, setTheme } = useApp();
  const isPfm = theme === "pfm";

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-background border-b border-border">
      <div className="mx-auto max-w-2xl px-4 h-14 flex items-center gap-3">

        {/* Logo — black square */}
        <div className="h-9 w-9 grid place-items-center rounded-xl bg-foreground text-background font-display font-extrabold text-sm tracking-tight shrink-0">
          AP
        </div>

        {/* Search — light grey pill */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex-1 h-9 flex items-center gap-2 px-3 rounded-full bg-muted text-muted-foreground text-sm hover:bg-border transition-colors"
          aria-label="Search"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate">Search stories…</span>
        </button>

        {/* Theme toggle — minimal text switch */}
        <button
          onClick={() => setTheme(isPfm ? "default" : "pfm")}
          aria-label="Switch theme"
          className={cn(
            "h-8 px-3 rounded-full text-[11px] font-semibold border transition-colors",
            isPfm
              ? "bg-foreground text-background border-foreground"
              : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
          )}
        >
          {isPfm ? "PFM" : "Default"}
        </button>

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
