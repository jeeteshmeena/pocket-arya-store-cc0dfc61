import { Search, ShoppingCart, Zap, Sparkles, Leaf } from "lucide-react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

const THEME_CONFIG = {
  default: { label: "Default",  icon: Leaf,     next: "pfm",     color: "bg-emerald-500" },
  pfm:     { label: "PFM",      icon: Sparkles,  next: "night",   color: "bg-violet-600"  },
  night:   { label: "Night",    icon: Zap,       next: "default", color: "bg-cyan-500"    },
} as const;

export function Header() {
  const { cart, setCartOpen, setSearchOpen, theme, cycleTheme } = useApp();
  const cfg = THEME_CONFIG[theme as keyof typeof THEME_CONFIG] ?? THEME_CONFIG.default;
  const Icon = cfg.icon;

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border">
      <div className="mx-auto max-w-2xl px-4 h-14 flex items-center gap-3">
        {/* Logo */}
        <div className="h-9 w-9 grid place-items-center rounded-xl bg-primary text-primary-foreground font-display font-extrabold text-sm tracking-tight shrink-0">
          AP
        </div>

        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex-1 h-9 flex items-center gap-2 px-3 rounded-full bg-surface text-muted-foreground text-sm transition-colors hover:text-foreground"
          aria-label="Search"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate">Search stories</span>
        </button>

        {/* Theme cycle button — tap to cycle: Default → PFM → Night */}
        <button
          onClick={cycleTheme}
          aria-label={`Switch to ${cfg.next} theme`}
          title={`Current: ${cfg.label} — Tap to change`}
          className={cn(
            "h-8 w-8 rounded-full grid place-items-center shrink-0 transition-all active:scale-90",
            cfg.color, "text-white shadow-lg"
          )}
        >
          <Icon className="h-4 w-4" />
        </button>

        {/* Cart */}
        <button
          id="arya-cart-target"
          onClick={() => setCartOpen(true)}
          className="relative h-9 w-9 grid place-items-center rounded-full bg-surface border border-border active:scale-90 transition shrink-0"
          aria-label="Cart"
        >
          <ShoppingCart className="h-4 w-4" />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center">
              {cart.length}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
