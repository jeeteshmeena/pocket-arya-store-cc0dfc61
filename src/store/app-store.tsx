import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Story } from "@/lib/data";
import { fetchStories, checkoutCart, openTelegramLink, fetchAppContext, type TelegramIdentity } from "@/lib/api";
import { type CurrencyCode, CURRENCY_MAP, type Currency } from "@/lib/currency";
import { type LanguageCode, TRANSLATIONS } from "@/lib/i18n";

type Theme = "default" | "dark" | "teal" | "cream" | "mint" | "romantic";
type View =
  | { name: "home" }
  | { name: "explore" }
  | { name: "mystories" }
  | { name: "profile" }
  | { name: "detail"; storyId: string }
  | { name: "purchased-detail"; storyId: string }
  | { name: "settings" }
  | { name: "checkout" }
  | { name: "support" }
  | { name: "admin" };

type CheckoutState =
  | { status: "idle" }
  | { status: "processing" }
  | { status: "success"; url: string; order_id?: string }
  | { status: "error"; message: string };


type Ctx = {
  theme: Theme;
  setTheme: (t: Theme) => void;

  // Currency
  currency: Currency;
  setCurrency: (code: CurrencyCode) => void;

  // i18n
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;

  // Preferences
  appPreferences: {
    autoplayHero: boolean;
    showPrices: boolean;
    reduceMotion: boolean;
  };
  setAppPreference: (key: keyof Ctx["appPreferences"], value: boolean) => void;

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

  // Wishlist — "Want to Listen"
  wishlist: Story[];
  toggleWishlist: (s: Story) => void;
  inWishlist: (id: string) => boolean;

  // UI
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  view: View;
  navigate: (v: View) => void;
  replaceView: (v: View) => void;
  back: () => void;

  // Checkout
  checkoutState: CheckoutState;
  resetCheckout: () => void;
  startCheckout: (items: Story[]) => Promise<void>;
  goToCheckout: () => void;  // just navigate, payment handled in CheckoutView

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
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem("arya_theme") as Theme) || "dark";
  });
  const [stories, setStories] = useState<Story[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [storiesError, setStoriesError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [tgUser, setTgUser] = useState<TelegramIdentity>({ telegram_id: null, username: null });

  const [appPreferences, setAppPreferences] = useState(() => {
    if (typeof window === "undefined") return { autoplayHero: true, showPrices: true, reduceMotion: false };
    try {
      const saved = localStorage.getItem("arya_prefs");
      if (saved) return { ...{ autoplayHero: true, showPrices: true, reduceMotion: false }, ...JSON.parse(saved) };
    } catch {}
    return { autoplayHero: true, showPrices: true, reduceMotion: false };
  });

  const setAppPreference = (key: keyof Ctx["appPreferences"], value: boolean) => {
    setAppPreferences((p: any) => {
      const np = { ...p, [key]: value };
      localStorage.setItem("arya_prefs", JSON.stringify(np));
      return np;
    });
  };

  const [cart, setCart] = useState<Story[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("arya_cart");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  
  useEffect(() => {
    localStorage.setItem("arya_cart", JSON.stringify(cart));
  }, [cart]);
  const [purchased, setPurchased] = useState<Story[]>([]);
  const [wishlist, setWishlist] = useState<Story[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("arya_wishlist");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  useEffect(() => {
    localStorage.setItem("arya_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [history, setHistory] = useState<View[]>([{ name: "home" }]);
  const [checkoutState, setCheckoutState] = useState<CheckoutState>({ status: "idle" });
  const [deepLinkError, setDeepLinkError] = useState<string | null>(null);

  // Currency
  // Always start fresh (no cached INR), IP detection will set the real currency
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>(() => {
    if (typeof window === "undefined") return "INR";
    // ONLY respect stored currency if user manually overrode it via Settings
    const hasManualOverride = localStorage.getItem("arya_currency_manual_override");
    if (hasManualOverride) {
      return (localStorage.getItem("arya_currency") as CurrencyCode) || "INR";
    }
    // New & existing users: start with INR, IP detection will override below
    return "INR";
  });
  const currency = CURRENCY_MAP[currencyCode] || CURRENCY_MAP["INR"];

  // setCurrency is called from Settings dropdown -> marks as intentional manual override
  const setCurrency = (code: CurrencyCode) => {
    setCurrencyCode(code);
    localStorage.setItem("arya_currency", code);
    localStorage.setItem("arya_currency_manual_override", "1");
    localStorage.removeItem("arya_currency_set"); // clean up old flag
  };

  // i18n
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window === "undefined") return "en";
    return (localStorage.getItem("arya_language") as LanguageCode) || "en";
  });
  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem("arya_language", lang);
  };
  const t = (key: string) => TRANSLATIONS[language]?.[key] || TRANSLATIONS["en"]?.[key] || key;

  // AUTO-DETECT CURRENCY FROM IP — runs on EVERY app load
  // Skipped ONLY when user has set arya_currency_manual_override via Settings
  useEffect(() => {
    const hasManualOverride = localStorage.getItem("arya_currency_manual_override");
    if (hasManualOverride) return; // User chose manually — respect their choice

    fetchAppContext()
      .then((ctx) => {
        if (ctx.currency && CURRENCY_MAP[ctx.currency as CurrencyCode]) {
          // Force apply for ALL users — including existing ones stuck on INR
          setCurrencyCode(ctx.currency as CurrencyCode);
          localStorage.setItem("arya_currency", ctx.currency);
          localStorage.removeItem("arya_currency_set"); // clean legacy flag
        }
      })
      .catch(() => { /* silent fallback */ });
  }, []);

  useEffect(() => {
    if (tgUser.telegram_id) {
      import("@/lib/api").then(({ fetchMyPurchases }) => {
        fetchMyPurchases(tgUser.telegram_id!).then((items) => {
          // Map to Story array so length and access works properly
          setPurchased(items.map(i => ({
            id: i.story_id,
            title: i.title,
            poster: i.poster,
            price: i.price,
            platform: i.platform,
            genre: i.genre,
            isCompleted: i.isCompleted,
            episodes: i.episodes,
          } as unknown as Story)));
        });
      });
    }
  }, [tgUser.telegram_id]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-dark", "theme-teal", "theme-cream", "theme-mint", "theme-romantic");
    if (theme !== "default") root.classList.add(`theme-${theme}`);
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

    // ── Stale-while-revalidate: show cached stories instantly ──────────
    const CACHE_KEY = "arya_stories_cache";
    const CACHE_TS  = "arya_stories_ts";
    const MAX_AGE   = 5 * 60 * 1000; // 5 minutes

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const ts     = Number(localStorage.getItem(CACHE_TS) || 0);
      if (cached && Date.now() - ts < MAX_AGE) {
        const parsed = JSON.parse(cached) as Story[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStories(parsed);
          setStoriesLoading(false); // show immediately
        }
      }
    } catch {}

    // Always refresh from network in background
    fetchStories()
      .then((list) => {
        if (cancelled) return;
        setStories(list);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(list));
          localStorage.setItem(CACHE_TS, String(Date.now()));
        } catch {}
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
        // Only show error if we have no cached data
        setStories((prev) => {
          if (prev.length === 0) setStoriesError(err.message || "Failed to load stories");
          return prev;
        });
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
    currency,
    setCurrency,
    language,
    setLanguage,
    t,
    appPreferences,
    setAppPreference,
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
    wishlist,
    toggleWishlist: (s) => setWishlist((w) =>
      w.find((x) => x.id === s.id) ? w.filter((x) => x.id !== s.id) : [...w, s]
    ),
    inWishlist: (id) => wishlist.some((x) => x.id === id),
    cartOpen, setCartOpen,
    searchOpen, setSearchOpen,
    view,
    navigate: (v) => setHistory((h) => [...h, v]),
    replaceView: (v) => setHistory(() => [{ name: "home" }, v]),
    back: () => setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h)),
    checkoutState,
    resetCheckout: () => setCheckoutState({ status: "idle" }),
    goToCheckout: () => {
      setCartOpen(false);
      setHistory((h) => [...h, { name: "checkout" }]);
    },
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
    deepLinkError,
    clearDeepLinkError: () => setDeepLinkError(null),
  }), [theme, currency, language, appPreferences, stories, storiesLoading, storiesError, tgUser, cart, purchased, wishlist, cartOpen, searchOpen, view, checkoutState, deepLinkError]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
