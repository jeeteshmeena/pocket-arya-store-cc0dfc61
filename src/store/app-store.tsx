import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Story } from "@/lib/data";
import { fetchStories, checkoutCart, openTelegramLink, type TelegramIdentity } from "@/lib/api";

type Theme = "default" | "pfm";
type View =
  | { name: "home" }
  | { name: "explore" }
  | { name: "mystories" }
  | { name: "profile" }
  | { name: "detail"; storyId: string }
  | { name: "settings" }
  | { name: "checkout" };

type CheckoutState =
  | { status: "idle" }
  | { status: "processing" }
  | { status: "success"; url: string; order_id?: string }
  | { status: "error"; message: string };


type Ctx = {
  theme: Theme;
  setTheme: (t: Theme) => void;

  // Data
  stories: Story[];
  storiesLoading: boolean;
  storiesError: string | null;
  reloadStories: () => void;

  // Telegram
  tgUser: TelegramIdentity;

  // Cart
  cart: Story[];
  addToCart: (s: Story) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;

  // Library (delivered after bot confirms — kept locally for now)
  purchased: Story[];
  purchase: (items: Story[]) => void;

  // UI
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  view: View;
  navigate: (v: View) => void;
  back: () => void;

  // Checkout
  checkoutState: CheckoutState;
  resetCheckout: () => void;
  startCheckout: (items: Story[]) => Promise<void>;

  // Deep link
  deepLinkError: string | null;
  clearDeepLinkError: () => void;
};

const AppCtx = createContext<Ctx | null>(null);

function readTelegramIdentity(): TelegramIdentity {
  if (typeof window === "undefined") return { telegram_id: null, username: null };
  try {
    const u = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    if (!u) return { telegram_id: null, username: null };
    return {
      telegram_id: typeof u.id === "number" ? u.id : null,
      username: typeof u.username === "string" ? u.username : null,
    };
  } catch {
    return { telegram_id: null, username: null };
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "default";
    return (localStorage.getItem("arya_theme") as Theme) || "default";
  });
  const [stories, setStories] = useState<Story[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [storiesError, setStoriesError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [tgUser, setTgUser] = useState<TelegramIdentity>({ telegram_id: null, username: null });

  const [cart, setCart] = useState<Story[]>([]);
  const [purchased, setPurchased] = useState<Story[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [history, setHistory] = useState<View[]>([{ name: "home" }]);
  const [checkoutState, setCheckoutState] = useState<CheckoutState>({ status: "idle" });
  const [deepLinkError, setDeepLinkError] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("theme-pfm", theme === "pfm");
    localStorage.setItem("arya_theme", theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const init = () => {
      if (cancelled) return;
      try {
        const tg = (window as any)?.Telegram?.WebApp;
        if (tg && typeof tg === "object") {
          if (typeof tg.ready === "function") tg.ready();
          if (typeof tg.expand === "function") tg.expand();
          setTgUser(readTelegramIdentity());
          return;
        }
      } catch {}
      if (attempts++ < 10) {
        setTimeout(init, 150);
      } else {
        setTgUser(readTelegramIdentity());
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStoriesLoading(true);
    setStoriesError(null);
    fetchStories()
      .then((list) => {
        if (cancelled) return;
        setStories(list);
        // Deep link: open a specific story if requested via Telegram start_param or ?story=
        try {
          let target: string | null = null;
          const tg = (window as any)?.Telegram?.WebApp;
          const sp = tg?.initDataUnsafe?.start_param;
          if (typeof sp === "string" && sp) {
            target = sp.replace(/^story[_-]?/i, "");
          }
          if (!target && typeof window !== "undefined") {
            const usp = new URLSearchParams(window.location.search);
            target = usp.get("story");
          }
          if (target) {
            if (list.find((s) => s.id === target)) {
              setHistory((h) => [...h, { name: "detail", storyId: target! }]);
            } else {
              setDeepLinkError(target);
            }
          }
        } catch {}
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setStoriesError(err.message || "Failed to load stories");
      })
      .finally(() => {
        if (!cancelled) setStoriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const view = history[history.length - 1];

  const value = useMemo<Ctx>(() => ({
    theme,
    setTheme: setThemeState,
    stories,
    storiesLoading,
    storiesError,
    reloadStories: () => setReloadKey((k) => k + 1),
    tgUser,
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
    checkoutState,
    resetCheckout: () => setCheckoutState({ status: "idle" }),
    startCheckout: async (items) => {
      if (!items.length) return;
      setCheckoutState({ status: "processing" });
      setHistory((h) => [...h, { name: "checkout" }]);
      try {
        const res = await checkoutCart(items.map((s) => s.id), tgUser);
        setCheckoutState({ status: "success", url: res.checkout_url, order_id: res.order_id });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Checkout failed";
        setCheckoutState({ status: "error", message });
      }
    },
  }), [theme, stories, storiesLoading, storiesError, tgUser, cart, purchased, cartOpen, searchOpen, view, checkoutState]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
