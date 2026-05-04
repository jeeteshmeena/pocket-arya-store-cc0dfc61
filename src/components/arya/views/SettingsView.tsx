import { ArrowLeft, Check } from "lucide-react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

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
          <ThemeOption
            title="Default Clean"
            desc="Minimal modern UI, Spotify-inspired"
            active={theme === "default"}
            onClick={() => setTheme("default")}
          />
          <ThemeOption
            title="Pocket FM Style"
            desc="Bold typography, content-first hierarchy"
            active={theme === "pfm"}
            onClick={() => setTheme("pfm")}
          />
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

function ThemeOption({ title, desc, active, onClick }: { title: string; desc: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn(
      "w-full text-left p-4 rounded-2xl border transition",
      active ? "border-primary bg-primary/5" : "border-border bg-surface"
    )}>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
        </div>
        {active && <Check className="h-5 w-5 text-primary" />}
      </div>
    </button>
  );
}

function Toggle({ label, defaultOn }: { label: string; defaultOn?: boolean }) {
  return (
    <label className="flex items-center justify-between px-4 py-3.5 cursor-pointer">
      <span className="text-sm">{label}</span>
      <input type="checkbox" defaultChecked={defaultOn} className="h-5 w-9 appearance-none bg-muted rounded-full relative transition checked:bg-primary cursor-pointer
        before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:h-4 before:w-4 before:bg-white before:rounded-full before:transition checked:before:translate-x-4" />
    </label>
  );
}
