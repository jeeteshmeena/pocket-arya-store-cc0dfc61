import { Search, ShoppingCart, SunMoon, X } from "lucide-react";
import { useApp } from "@/store/app-store";

export function Header() {
  const { cart, setCartOpen, setSearchOpen, theme, setTheme, searchOpen } = useApp();

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border">
      <div className="mx-auto max-w-2xl px-4 h-14 flex items-center gap-3">
        <div className="font-display font-bold tracking-tight text-base pfm:text-lg">
          Arya <span className="text-primary">Premium</span>
        </div>
        <button
          onClick={() => setSearchOpen(true)}
          className="flex-1 h-9 flex items-center gap-2 px-3 rounded-full bg-surface text-muted-foreground text-sm transition-colors hover:text-foreground"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
          <span className="truncate">Search stories</span>
        </button>
        <button
          onClick={() => setTheme(theme === "default" ? "pfm" : "default")}
          className="h-9 w-9 grid place-items-center rounded-full hover:bg-surface transition"
          aria-label="Toggle theme"
        >
          <SunMoon className="h-4.5 w-4.5" />
        </button>
        <button
          onClick={() => setCartOpen(true)}
          className="relative h-9 w-9 grid place-items-center rounded-full hover:bg-surface transition"
          aria-label="Cart"
        >
          <ShoppingCart className="h-4.5 w-4.5" />
          {cart.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold grid place-items-center">
              {cart.length}
            </span>
          )}
        </button>
      </div>
      {searchOpen && (
        <button
          onClick={() => setSearchOpen(false)}
          className="hidden"
          aria-hidden
        ><X /></button>
      )}
    </header>
  );
}
