import { ArrowLeft, Check } from "lucide-react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

type ThemeId = "default" | "dark" | "teal" | "cream" | "mint";

type ThemePreset = {
  id: ThemeId;
  title: string;
  desc: string;
  font: string;
  // Preview swatches
  canvas: string;
  card: string;
  ink: string;
  accent: string;
};

const THEMES: ThemePreset[] = [
  {
    id: "default",
    title: "Default",
    desc: "Clean white · Black accent",
    font: "Inter",
    canvas: "#F8F8F8", card: "#FFFFFF", ink: "#111111", accent: "#111111",
  },
  {
    id: "dark",
    title: "Midnight Dark",
    desc: "Deep black · High contrast",
    font: "Inter",
    canvas: "#09090B", card: "#18181B", ink: "#FAFAFA", accent: "#FAFAFA",
  },
  {
    id: "teal",
    title: "Premium Teal",
    desc: "Deep teal · Bright accents",
    font: "Fraunces",
    canvas: "#061E1E", card: "#0A2A2A", ink: "#F1FAF8", accent: "#17A2B8",
  },
  {
    id: "cream",
    title: "Soft Cream",
    desc: "Warm pink · Blue CTA",
    font: "DM Serif",
    canvas: "#F5D5C8", card: "#FFFFFF", ink: "#1B1B1F", accent: "#2D6CDF",
  },
  {
    id: "mint",
    title: "Mint Plant",
    desc: "Sky canvas · Mint CTA",
    font: "Plus Jakarta",
    canvas: "#DCE7F2", card: "#FFFFFF", ink: "#0B1220", accent: "#4FE3A1",
  },
];

function ThemeThumb({ t, active, onClick }: { t: ThemePreset; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative text-left rounded-2xl overflow-hidden border-2 transition-all active:scale-[0.98]",
        active ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-muted-foreground/40"
      )}
    >
      {/* Mini phone preview */}
      <div className="aspect-[4/3] w-full p-3" style={{ backgroundColor: t.canvas }}>
        <div className="w-full h-full rounded-xl flex flex-col gap-1.5 p-2 shadow-sm" style={{ backgroundColor: t.card }}>
          {/* fake header */}
          <div className="flex items-center justify-between">
            <div className="h-2 w-8 rounded-full" style={{ backgroundColor: t.ink, opacity: 0.85 }} />
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: t.accent }} />
          </div>
          {/* fake hero */}
          <div className="h-6 rounded-md" style={{ backgroundColor: t.accent, opacity: 0.85 }} />
          {/* fake cards row */}
          <div className="flex gap-1 mt-0.5">
            <div className="flex-1 h-6 rounded" style={{ backgroundColor: t.canvas, opacity: 0.6 }} />
            <div className="flex-1 h-6 rounded" style={{ backgroundColor: t.canvas, opacity: 0.4 }} />
            <div className="flex-1 h-6 rounded" style={{ backgroundColor: t.canvas, opacity: 0.6 }} />
          </div>
          {/* fake floating pill nav */}
          <div className="mt-auto mx-auto h-3 w-16 rounded-full" style={{ backgroundColor: t.ink, opacity: 0.9 }} />
        </div>
      </div>
      {/* Label */}
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
  const { back, theme, setTheme } = useApp();
  return (
    <div className="animate-fade-in px-4 pt-3 pb-8">
      <div className="flex items-center gap-2">
        <button onClick={back} className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display font-bold text-xl">Settings</h1>
      </div>

      <section className="mt-5">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground px-1 mb-3">Theme</div>
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map((t) => (
            <ThemeThumb key={t.id} t={t} active={theme === t.id} onClick={() => setTheme(t.id)} />
          ))}
        </div>
      </section>

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
