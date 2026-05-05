import { Search, ShoppingCart, Palette } from "lucide-react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { useState } from "react";

const THEMES = [
  { id: "default", label: "Default" },
  { id: "pfm", label: "Pocket FM" },
];

function ThemeSelector() {
  const { theme, setTheme } = useApp();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative h-9 w-9 grid place-items-center rounded-full bg-muted transition shrink-0 hover:bg-border/50 active:scale-95"
        aria-label="Select Theme"
      >
        <Palette className="h-4 w-4 text-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-36 bg-surface border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id as any);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-3 text-sm font-medium transition-colors",
                  theme === t.id ? "bg-foreground text-background" : "hover:bg-muted text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function Header() {
  const { cart, setCartOpen, setSearchOpen } = useApp();

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="mx-auto max-w-2xl px-4 h-14 flex items-center justify-between gap-3">
        
        {/* Logo - left side */}
        <div className="h-9 w-9 grid place-items-center rounded-xl bg-foreground text-background font-display font-extrabold text-sm tracking-tight shrink-0 shadow-sm">
          AP
        </div>

        {/* Right section - Flex container */}
        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
          
          {/* Search Button - Looks like a premium input field but acts as a button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex flex-1 max-w-[180px] items-center gap-2 h-9 rounded-full bg-surface border border-border px-3 shadow-sm active:scale-[0.98] transition hover:bg-muted"
          >
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground truncate">Search...</span>
          </button>

          {/* Theme Dropdown */}
          <ThemeSelector />

          {/* Cart Button */}
          <button
            id="arya-cart-target"
            onClick={() => setCartOpen(true)}
            className="relative h-9 w-9 grid place-items-center rounded-full bg-muted transition shrink-0 hover:bg-border/50 active:scale-95"
            aria-label="Cart"
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
    </header>
  );
}
