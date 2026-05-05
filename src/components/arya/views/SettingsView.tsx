import { ArrowLeft, Check, Leaf, Sparkles, Zap } from "lucide-react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

const THEMES = [
  {
    id: "default" as const,
    title: "Default Clean",
    desc: "Minimal dark UI · Green accent · Inter font",
    icon: Leaf,
    accent: "#1DB954",
  },
  {
    id: "pfm" as const,
    title: "Pocket FM Style",
    desc: "Pure black · Purple accent · Nunito font",
    icon: Sparkles,
    accent: "#7B3AED",
  },
  {
    id: "night" as const,
    title: "Night / AMOLED",
    desc: "AMOLED black · Cyan neon · Space Grotesk",
    icon: Zap,
    accent: "#00C9FF",
  },
] as const;

export function SettingsView() {
  const { back, theme, setTheme } = useApp();
  return (
    <div className="animate-fade-in px-4 pt-3">
      <div className="flex items-center gap-2">
        <button onClick={back} className="h-9 w-9 grid place-items-center rounded-full hover:bg-surface">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display font-bold text-xl">Settings</h1>
      </div>

      <section className="mt-5">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground px-1 mb-2">Appearance</div>
        <div className="space-y-2">
          {THEMES.map((t) => {
            const Icon = t.icon;
            const active = theme === t.id;
            return (
              <button key={t.id} onClick={() => setTheme(t.id)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl border transition-all duration-200",
                  active ? "border-primary bg-primary/8" : "border-border bg-surface"
                )}>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl grid place-items-center shrink-0 text-white"
                    style={{ background: t.accent }}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{t.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
                  </div>
                  {active && <Check className="h-5 w-5 text-primary shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground px-1 mb-2">Preferences</div>
        <div className="rounded-2xl bg-surface divide-y divide-border">
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
      <span className="text-sm">{label}</span>
      <input type="checkbox" defaultChecked={defaultOn}
        className="h-5 w-9 appearance-none bg-muted rounded-full relative transition checked:bg-primary cursor-pointer
          before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:h-4 before:w-4 before:bg-white before:rounded-full before:transition checked:before:translate-x-4" />
    </label>
  );
}
