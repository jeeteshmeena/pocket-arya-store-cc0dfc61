import { ArrowLeft, Check } from "lucide-react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { CURRENCIES, type CurrencyCode } from "@/lib/currency";
import { useState } from "react";

type ThemeId = "default" | "dark" | "teal" | "cream" | "mint" | "romantic";

type ThemePreset = {
  id: ThemeId;
  title: string;
  desc: string;
  font: string;
  canvas: string; card: string; ink: string; accent: string;
};

const THEMES: ThemePreset[] = [
  { id: "default",  title: "Default",       desc: "Clean white",       font: "Inter",     canvas: "#F8F8F8", card: "#FFFFFF", ink: "#111111", accent: "#111111" },
  { id: "dark",     title: "Midnight",       desc: "Deep black",        font: "Inter",     canvas: "#09090B", card: "#18181B", ink: "#FAFAFA", accent: "#FAFAFA" },
  { id: "teal",     title: "Teal",           desc: "Deep teal",         font: "Fraunces",  canvas: "#061E1E", card: "#0A2A2A", ink: "#F1FAF8", accent: "#17A2B8" },
  { id: "cream",    title: "Cream",          desc: "Warm pink",         font: "DM Serif",  canvas: "#F5D5C8", card: "#FFFFFF", ink: "#1B1B1F", accent: "#2D6CDF" },
  { id: "mint",     title: "Mint",           desc: "Sky blue",          font: "Fraunces",  canvas: "#DCE7F2", card: "#FFFFFF", ink: "#0B1F2A", accent: "#1FBF7A" },
  { id: "romantic", title: "Romance",        desc: "Burgundy",          font: "DM Serif",  canvas: "#1A0810", card: "#2A0E1A", ink: "#FBE9EE", accent: "#E85D8A" },
];

function CompactThumbRow({ t, active, onClick }: { t: ThemePreset; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all active:scale-[0.98]",
        active ? "ring-2 ring-primary/30" : "hover:bg-muted/50"
      )}
      style={active ? { backgroundColor: t.canvas + "33" } : {}}
    >
      {/* Mini swatch */}
      <div className="flex gap-0.5 shrink-0">
        <div className="h-6 w-6 rounded-lg" style={{ backgroundColor: t.canvas }} />
        <div className="h-6 w-3 rounded-r-lg -ml-3" style={{ backgroundColor: t.accent }} />
      </div>
      <div className="flex-1 text-left">
        <div className="text-[13px] font-semibold text-foreground">{t.title}</div>
        <div className="text-[10px] text-muted-foreground">{t.font} · {t.desc}</div>
      </div>
      {active && (
        <div className="h-5 w-5 shrink-0 rounded-full bg-primary grid place-items-center">
          <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
        </div>
      )}
    </button>
  );
}

function ThemeThumb({ t, active, onClick }: { t: ThemePreset; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative text-left rounded-2xl overflow-hidden border-2 transition-all active:scale-[0.98]",
        active ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-muted-foreground/40"
      )}
    >
      <div className="aspect-[4/3] w-full p-3" style={{ backgroundColor: t.canvas }}>
        <div className="w-full h-full rounded-xl flex flex-col gap-1.5 p-2 shadow-sm" style={{ backgroundColor: t.card }}>
          <div className="flex items-center justify-between">
            <div className="h-2 w-8 rounded-full" style={{ backgroundColor: t.ink, opacity: 0.85 }} />
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: t.accent }} />
          </div>
          <div className="h-6 rounded-md" style={{ backgroundColor: t.accent, opacity: 0.85 }} />
          <div className="flex gap-1 mt-0.5">
            <div className="flex-1 h-6 rounded" style={{ backgroundColor: t.canvas, opacity: 0.6 }} />
            <div className="flex-1 h-6 rounded" style={{ backgroundColor: t.canvas, opacity: 0.4 }} />
            <div className="flex-1 h-6 rounded" style={{ backgroundColor: t.canvas, opacity: 0.6 }} />
          </div>
          <div className="mt-auto mx-auto h-3 w-16 rounded-full" style={{ backgroundColor: t.ink, opacity: 0.9 }} />
        </div>
      </div>
      <div className="px-3 py-2.5 bg-surface flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-foreground truncate">{t.title}</div>
          <div className="text-[10px] text-muted-foreground truncate">{t.font} · {t.desc}</div>
        </div>
        {active && (
          <div className="h-5 w-5 shrink-0 rounded-full bg-primary grid place-items-center">
            <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
          </div>
        )}
      </div>
    </button>
  );
}

export function SettingsView() {
  const { back, theme, setTheme, currency, setCurrency } = useApp();
  const [themeMode, setThemeMode] = useState<"grid" | "list">("list");
  const [currencySearch, setCurrencySearch] = useState("");

  const filtered = currencySearch.trim()
    ? CURRENCIES.filter(c =>
        c.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
        c.code.toLowerCase().includes(currencySearch.toLowerCase())
      )
    : CURRENCIES;

  return (
    <div className="animate-fade-in px-4 pt-3 pb-8">
      <div className="flex items-center gap-2">
        <button onClick={back} className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display font-bold text-xl">Settings</h1>
      </div>

      {/* ── Theme ── */}
      <section className="mt-5">
        <div className="flex items-center justify-between px-1 mb-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Theme</div>
          <div className="flex gap-1 bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setThemeMode("list")}
              className={cn("px-2.5 py-1 text-[11px] font-semibold rounded-md transition", themeMode === "list" ? "bg-surface shadow text-foreground" : "text-muted-foreground")}
            >List</button>
            <button
              onClick={() => setThemeMode("grid")}
              className={cn("px-2.5 py-1 text-[11px] font-semibold rounded-md transition", themeMode === "grid" ? "bg-surface shadow text-foreground" : "text-muted-foreground")}
            >Grid</button>
          </div>
        </div>

        {themeMode === "list" ? (
          <div className="rounded-2xl bg-surface border border-border divide-y divide-border overflow-hidden">
            {THEMES.map(t => (
              <CompactThumbRow key={t.id} t={t} active={theme === t.id} onClick={() => setTheme(t.id)} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {THEMES.map(t => (
              <ThemeThumb key={t.id} t={t} active={theme === t.id} onClick={() => setTheme(t.id)} />
            ))}
          </div>
        )}
      </section>

      {/* ── Currency ── */}
      <section className="mt-6">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground px-1 mb-3">Currency</div>

        {/* Current selection pill */}
        <div className="flex items-center gap-3 mb-3 px-3 py-2.5 rounded-xl bg-primary/10 border border-primary/20">
          <span className="text-2xl">{currency.flag}</span>
          <div>
            <div className="text-sm font-bold text-foreground">{currency.name}</div>
            <div className="text-[11px] text-muted-foreground">{currency.code} · {currency.symbol} · Prices auto-converted from INR</div>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          value={currencySearch}
          onChange={e => setCurrencySearch(e.target.value)}
          placeholder="Search currency..."
          className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border text-sm mb-2 outline-none focus:border-primary"
        />

        {/* Currency list */}
        <div className="rounded-2xl bg-surface border border-border divide-y divide-border overflow-hidden max-h-72 overflow-y-auto">
          {filtered.map(c => (
            <button
              key={c.code}
              onClick={() => setCurrency(c.code as CurrencyCode)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 text-left transition active:scale-[0.98]",
                currency.code === c.code ? "bg-primary/10" : "hover:bg-muted/50"
              )}
            >
              <span className="text-xl shrink-0">{c.flag}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-foreground truncate">{c.name}</div>
                <div className="text-[10px] text-muted-foreground">{c.code} · {c.symbol}</div>
              </div>
              {currency.code === c.code && (
                <div className="h-5 w-5 shrink-0 rounded-full bg-primary grid place-items-center">
                  <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* ── Preferences ── */}
      <section className="mt-6">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground px-1 mb-2">Preferences</div>
        <div className="rounded-2xl bg-surface border border-border divide-y divide-border">
          <Toggle label="Auto-play hero slider" defaultOn />
          <Toggle label="Show price in cards" defaultOn />
          <Toggle label="Reduce motion" />
        </div>
      </section>
    </div>
  );
}

function Toggle({ label, defaultOn }: { label: string; defaultOn?: boolean }) {
  return (
    <label className="flex items-center justify-between px-4 py-3.5 cursor-pointer">
      <span className="text-sm text-foreground">{label}</span>
      <input
        type="checkbox"
        defaultChecked={defaultOn}
        className="h-5 w-9 appearance-none bg-muted rounded-full relative transition-colors
          checked:bg-primary cursor-pointer
          before:content-[''] before:absolute before:top-0.5 before:left-0.5
          before:h-4 before:w-4 before:bg-white before:rounded-full
          before:transition-transform checked:before:translate-x-4"
      />
    </label>
  );
}
