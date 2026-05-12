import { ArrowLeft, Check } from "lucide-react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { CURRENCIES, type CurrencyCode } from "@/lib/currency";
import { LANGUAGE_NAMES, type LanguageCode } from "@/lib/i18n";
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
        "group relative text-left rounded-xl overflow-hidden border-2 transition-all active:scale-[0.95]",
        active ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-muted-foreground/40"
      )}
    >
      <div className="aspect-video w-full p-2" style={{ backgroundColor: t.canvas }}>
        <div className="w-full h-full rounded-md flex flex-col gap-1 p-1.5 shadow-sm" style={{ backgroundColor: t.card }}>
          <div className="flex items-center justify-between">
            <div className="h-1.5 w-6 rounded-full" style={{ backgroundColor: t.ink, opacity: 0.85 }} />
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.accent }} />
          </div>
          <div className="h-3 rounded-sm mt-0.5" style={{ backgroundColor: t.accent, opacity: 0.85 }} />
          <div className="flex gap-0.5 mt-auto">
            <div className="flex-1 h-3 rounded-[2px]" style={{ backgroundColor: t.canvas, opacity: 0.6 }} />
            <div className="flex-1 h-3 rounded-[2px]" style={{ backgroundColor: t.canvas, opacity: 0.4 }} />
          </div>
        </div>
      </div>
      <div className="px-2 py-1.5 bg-surface flex items-center justify-between gap-1 border-t border-border/50">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold text-foreground truncate leading-tight">{t.title}</div>
        </div>
        {active && (
          <div className="h-3.5 w-3.5 shrink-0 rounded-full bg-primary grid place-items-center">
            <Check className="h-2 w-2 text-primary-foreground" strokeWidth={3} />
          </div>
        )}
      </div>
    </button>
  );
}

export function SettingsView() {
  const { back, theme, setTheme, currency, setCurrency, language, setLanguage, t, appPreferences, setAppPreference } = useApp();

  return (
    <div className="animate-fade-in px-4 pt-3 pb-8">
      <div className="flex items-center gap-2">
        <button onClick={back} className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display font-bold text-xl">{t("settings.title")}</h1>
      </div>

      {/* ── Theme ── */}
      <section className="mt-5">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground px-1 mb-2">Theme</div>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map(t => (
            <ThemeThumb key={t.id} t={t} active={theme === t.id} onClick={() => setTheme(t.id)} />
          ))}
        </div>
      </section>

      {/* ── Language ── */}
      <section className="mt-6">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground px-1 mb-2">{t("settings.language")}</div>
        <div className="relative">
          <select
            value={language}
            onChange={e => setLanguage(e.target.value as LanguageCode)}
            className="w-full appearance-none bg-surface border border-border rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-primary pr-10"
          >
            {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground">
            ▼
          </div>
        </div>
      </section>

      {/* ── Currency ── */}
      <section className="mt-6">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground px-1 mb-2">{t("settings.currency")}</div>
        <div className="relative">
          <select
            value={currency.code}
            onChange={e => setCurrency(e.target.value as CurrencyCode)}
            className="w-full appearance-none bg-surface border border-border rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-primary pr-10"
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code} - {c.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground">
            ▼
          </div>
        </div>
        <div className="px-2 mt-1.5 text-[10px] text-muted-foreground">All prices will be automatically converted from INR.</div>
      </section>

      {/* ── Preferences ── */}
      <section className="mt-6">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground px-1 mb-2">Preferences</div>
        <div className="rounded-2xl bg-surface border border-border divide-y divide-border">
          <Toggle 
            label="Auto-play hero slider" 
            checked={appPreferences?.autoplayHero ?? true} 
            onChange={(v) => setAppPreference("autoplayHero", v)} 
          />
          <Toggle 
            label="Show price in cards" 
            checked={appPreferences?.showPrices ?? true} 
            onChange={(v) => setAppPreference("showPrices", v)} 
          />
          <Toggle 
            label="Reduce motion" 
            checked={appPreferences?.reduceMotion ?? false} 
            onChange={(v) => setAppPreference("reduceMotion", v)} 
          />
        </div>
      </section>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between px-4 py-3.5 cursor-pointer">
      <span className="text-sm text-foreground">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-9 appearance-none bg-muted rounded-full relative transition-colors
          checked:bg-primary cursor-pointer
          before:content-[''] before:absolute before:top-0.5 before:left-0.5
          before:h-4 before:w-4 before:bg-white before:rounded-full
          before:transition-transform checked:before:translate-x-4"
      />
    </label>
  );
}
