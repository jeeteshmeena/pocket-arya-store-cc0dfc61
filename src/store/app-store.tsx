import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Story } from "@/lib/data";

type Theme = "default" | "pfm";
type View =
  | { name: "home" }
  | { name: "explore" }
  | { name: "mystories" }
  | { name: "profile" }
  | { name: "detail"; storyId: string }
  | { name: "settings" };

type Ctx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  cart: Story[];
  addToCart: (s: Story) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  purchased: Story[];
  purchase: (items: Story[]) => void;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  view: View;
  navigate: (v: View) => void;
  back: () => void;
  paymentItems: Story[] | null;
  startCheckout: (items: Story[]) => void;
  endCheckout: () => void;
  successOpen: boolean;
  setSuccessOpen: (v: boolean) => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "default";
    return (localStorage.getItem("arya_theme") as Theme) || "default";
  });
  const [cart, setCart] = useState<Story[]>([]);
  const [purchased, setPurchased] = useState<Story[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [history, setHistory] = useState<View[]>([{ name: "home" }]);
  const [paymentItems, setPaymentItems] = useState<Story[] | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("theme-pfm", theme === "pfm");
    localStorage.setItem("arya_theme", theme);
  }, [theme]);

  const view = history[history.length - 1];

  const value = useMemo<Ctx>(() => ({
    theme,
    setTheme: setThemeState,
    cart,
    addToCart: (s) => setCart((c) => (c.find((x) => x.id === s.id) ? c : [...c, s])),
    removeFromCart: (id) => setCart((c) => c.filter((x) => x.id !== id)),
    clearCart: () => setCart([]),
    purchased,
    purchase: (items) => setPurchased((p) => {
      const ids = new Set(p.map((x) => x.id));
      return [...p, ...items.filter((i) => !ids.has(i.id))];
    }),
    cartOpen, setCartOpen,
    searchOpen, setSearchOpen,
    view,
    navigate: (v) => setHistory((h) => [...h, v]),
    back: () => setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h)),
    paymentItems,
    startCheckout: (items) => setPaymentItems(items),
    endCheckout: () => setPaymentItems(null),
    successOpen, setSuccessOpen,
  }), [theme, cart, purchased, cartOpen, searchOpen, view, paymentItems, successOpen]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
