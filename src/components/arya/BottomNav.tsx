import { Home, Compass, Library, User, Headphones, BookOpen, Zap, BarChart2 } from "lucide-react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

// ────────────────────────────────────────────────────
// DEFAULT THEME — Spotify-style pill nav
// ────────────────────────────────────────────────────
const DEFAULT_TABS = [
  { id: "home",      label: "Home",       icon: Home },
  { id: "explore",   label: "Explore",    icon: Compass },
  { id: "mystories", label: "Library",    icon: Library },
  { id: "profile",   label: "Profile",    icon: User },
] as const;

function DefaultNav({ current, onNav }: { current: string; onNav: (id: string) => void }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40" style={{ paddingBottom: "max(env(safe-area-inset-bottom),6px)" }}>
      <div className="mx-auto max-w-2xl px-3 pb-2 pt-2">
        <div className="flex items-center justify-between gap-1 rounded-2xl px-1 py-1 bg-card/95 backdrop-blur-xl border border-border shadow-lg">
          {DEFAULT_TABS.map(({ id, label, icon: Icon }) => {
            const active = current === id;
            return (
              <button key={id} onClick={() => onNav(id)}
                aria-label={label} aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center justify-center overflow-hidden transition-all duration-300 h-10 rounded-xl",
                  active ? "flex-[2] bg-primary/15 text-primary px-3 gap-2" : "flex-1 text-muted-foreground hover:text-foreground px-2"
                )}>
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.4 : 1.8} />
                <span className={cn("text-[12px] font-semibold whitespace-nowrap transition-all duration-300",
                  active ? "max-w-[100px] opacity-100" : "max-w-0 opacity-0 overflow-hidden")}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// ────────────────────────────────────────────────────
// POCKET FM THEME — Exact match to real Pocket FM app
// icon + label below, active = purple oval behind icon only
// ────────────────────────────────────────────────────
const PFM_TABS = [
  { id: "home",      label: "HOME",     icon: Home },
  { id: "explore",   label: "DISCOVER", icon: Headphones },
  { id: "mystories", label: "LIBRARY",  icon: BookOpen },
  { id: "profile",   label: "PROFILE",  icon: User },
] as const;

function PfmNav({ current, onNav }: { current: string; onNav: (id: string) => void }) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40"
      style={{ background: "#0A0A0A", paddingBottom: "max(env(safe-area-inset-bottom),4px)" }}
    >
      {/* Top separator */}
      <div className="h-px bg-white/5" />
      <div className="mx-auto max-w-2xl">
        <div className="flex items-stretch justify-around">
          {PFM_TABS.map(({ id, label, icon: Icon }) => {
            const active = current === id;
            return (
              <button key={id} onClick={() => onNav(id)}
                aria-label={label} aria-current={active ? "page" : undefined}
                className="flex flex-col items-center justify-center flex-1 pt-3 pb-2 gap-1 transition-colors duration-200"
              >
                {/* Icon with purple oval when active */}
                <div className={cn(
                  "flex items-center justify-center w-12 h-7 rounded-full transition-all duration-300",
                  active ? "bg-[#7B3AED]" : "bg-transparent"
                )}>
                  <Icon
                    className={cn("h-[18px] w-[18px] transition-colors duration-200",
                      active ? "text-white" : "text-[#666]")}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                </div>
                {/* Label */}
                <span className={cn(
                  "text-[9px] font-black tracking-widest transition-colors duration-200",
                  active ? "text-white" : "text-[#555]"
                )}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// ────────────────────────────────────────────────────
// NIGHT THEME — Neon minimal (icon + label, cyan accent)
// ────────────────────────────────────────────────────
const NIGHT_TABS = [
  { id: "home",      label: "Home",       icon: Home },
  { id: "explore",   label: "Explore",    icon: BarChart2 },
  { id: "mystories", label: "Library",    icon: Library },
  { id: "profile",   label: "Profile",    icon: User },
] as const;

function NightNav({ current, onNav }: { current: string; onNav: (id: string) => void }) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40"
      style={{ background: "#000000", paddingBottom: "max(env(safe-area-inset-bottom),4px)" }}
    >
      <div className="h-px bg-[#00C9FF]/20" />
      <div className="mx-auto max-w-2xl">
        <div className="flex items-stretch justify-around">
          {NIGHT_TABS.map(({ id, label, icon: Icon }) => {
            const active = current === id;
            return (
              <button key={id} onClick={() => onNav(id)}
                aria-label={label} aria-current={active ? "page" : undefined}
                className="flex flex-col items-center justify-center flex-1 pt-3 pb-2 gap-1 relative"
              >
                {active && <span className="absolute top-0 inset-x-4 h-0.5 bg-[#00C9FF] rounded-full shadow-[0_0_8px_#00C9FF]" />}
                <Icon className={cn("h-5 w-5 transition-colors duration-200",
                  active ? "text-[#00C9FF]" : "text-[#444]")}
                  strokeWidth={active ? 2.5 : 1.8} />
                <span className={cn("text-[10px] font-semibold tracking-wide transition-colors duration-200",
                  active ? "text-[#00C9FF]" : "text-[#444]")}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// ────────────────────────────────────────────────────
// MAIN — switches by theme
// ────────────────────────────────────────────────────
export function BottomNav() {
  const { view, navigate, theme } = useApp();
  const current = view.name;
  const onNav = (id: string) => navigate({ name: id as any });

  if (theme === "pfm")   return <PfmNav   current={current} onNav={onNav} />;
  if (theme === "night") return <NightNav current={current} onNav={onNav} />;
  return <DefaultNav current={current} onNav={onNav} />;
}
