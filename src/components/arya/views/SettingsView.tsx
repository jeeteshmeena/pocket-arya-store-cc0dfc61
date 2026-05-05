import { ArrowLeft, Check } from "lucide-react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

const THEMES = [
  {
    id: "default" as const,
    title: "Default",
    desc: "Clean white · Black accent · Inter",
  },
  {
    id: "pfm" as const,
    title: "Pocket FM Style",
    desc: "White · Nunito font · Flat navigation",
  },
] as const;

export function SettingsView() {
  const { back, theme, setTheme } = useApp();
  return (
    <div className="animate-fade-in px-4 pt-3">
      <div className="flex items-center gap-2">
        <button onClick={back} className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display font-bold text-xl">Settings</h1>
      </div>

      <section className="mt-5">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground px-1 mb-2">Appearance</div>
        <div className="space-y-2">
          {THEMES.map((t) => {
            const active = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl border transition",
                  active ? "border-foreground bg-background" : "border-border bg-surface hover:border-muted-foreground"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">{t.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
                  </div>
                  {active && (
                    <div className="h-6 w-6 rounded-full bg-foreground grid place-items-center">
                      <Check className="h-3.5 w-3.5 text-background" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
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
          checked:bg-foreground cursor-pointer
          before:content-[''] before:absolute before:top-0.5 before:left-0.5
          before:h-4 before:w-4 before:bg-white before:rounded-full
          before:transition-transform checked:before:translate-x-4"
      />
    </label>
  );
}
