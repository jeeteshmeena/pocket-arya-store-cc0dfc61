import { Search, ShoppingCart, Sun, Moon } from "lucide-react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

export function Header() {
  const { cart, setCartOpen, setSearchOpen, theme, setTheme } = useApp();
  const isPfm = theme === "pfm";

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border">
      <div className="mx-auto max-w-2xl px-4 h-14 flex items-center gap-3">
        <div className="h-9 w-9 grid place-items-center rounded-xl bg-primary text-primary-foreground font-display font-extrabold text-sm tracking-tight">
          AP
        </div>
        <button
          onClick={() => setSearchOpen(true)}
          className="flex-1 h-9 flex items-center gap-2 px-3 rounded-full bg-surface text-muted-foreground text-sm transition-colors hover:text-foreground"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
          <span className="truncate">Search stories</span>
        </button>

        {/* Pill theme toggle */}
        <button
          onClick={() => setTheme(isPfm ? "default" : "pfm")}
          aria-label="Toggle theme"
          className="relative h-8 w-14 rounded-full bg-surface border border-border flex items-center px-1 transition-colors"
        >
          <span
            className={cn(
              "absolute top-1 h-6 w-6 rounded-full bg-primary text-primary-foreground grid place-items-center shadow transition-all duration-300 ease-out",
              isPfm ? "left-[calc(100%-1.75rem)]" : "left-1"
            )}
          >
            {isPfm ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
          </span>
          <Sun className={cn("h-3 w-3 ml-1 transition-opacity", isPfm ? "opacity-40" : "opacity-0")} />
          <Moon className={cn("h-3 w-3 ml-auto mr-1 transition-opacity", isPfm ? "opacity-0" : "opacity-40")} />
        </button>

        <button
          id="arya-cart-target"
          onClick={() => setCartOpen(true)}
          className="relative h-9 w-9 grid place-items-center rounded-full bg-surface border border-border active:scale-90 transition"
          aria-label="Cart"
        >
          <ShoppingCart className="h-4 w-4" />
          {cart.length > 0 && (
            <span
              key={cart.length}
              className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center animate-scale-in"
            >
              {cart.length}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
