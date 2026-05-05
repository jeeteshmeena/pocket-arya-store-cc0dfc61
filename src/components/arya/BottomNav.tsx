import { Home, Compass, Library, User, Headphones, BookOpen, Heart, Search } from "lucide-react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

// ── Default Theme Navigation ───────────────────────────────────────
// Spotify-style pill with expanding active label

const DEFAULT_TABS = [
  { id: "home",      label: "Home",       icon: Home },
  { id: "explore",   label: "Explore",    icon: Compass },
  { id: "mystories", label: "Library",    icon: Library },
  { id: "profile",   label: "Profile",    icon: User },
] as const;

function DefaultNav({ current, onNav }: { current: string; onNav: (id: string) => void }) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 6px)" }}
    >
      <div className="mx-auto max-w-2xl px-3 pb-2 pt-2">
        <div className="flex items-center justify-between gap-1 rounded-2xl px-1 py-1 bg-card/95 backdrop-blur-xl border border-border shadow-lg">
          {DEFAULT_TABS.map((t) => {
            const Icon = t.icon;
            const active = current === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onNav(t.id)}
                aria-label={t.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center justify-center overflow-hidden",
                  "transition-all duration-300 ease-in-out h-10 rounded-xl",
                  active
                    ? "flex-[2] bg-primary/15 text-primary px-3 gap-2"
                    : "flex-1 text-muted-foreground hover:text-foreground px-2"
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.4 : 1.8} />
                <span className={cn(
                  "text-[12px] font-semibold whitespace-nowrap transition-all duration-300",
                  active ? "max-w-[100px] opacity-100" : "max-w-0 opacity-0 overflow-hidden"
                )}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// ── Pocket FM Theme Navigation ─────────────────────────────────────
// Matches actual Pocket FM app: icon + label below, flat bottom bar

const PFM_TABS = [
  { id: "home",      label: "Home",     icon: Home },
  { id: "explore",   label: "Discover", icon: Headphones },
  { id: "mystories", label: "Library",  icon: BookOpen },
  { id: "profile",   label: "Profile",  icon: User },
] as const;

function PfmNav({ current, onNav }: { current: string; onNav: (id: string) => void }) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 4px)" }}
    >
      <div className="mx-auto max-w-2xl">
        <div className="flex items-stretch justify-around">
          {PFM_TABS.map((t) => {
            const Icon = t.icon;
            const active = current === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onNav(t.id)}
                aria-label={t.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 py-2.5 min-h-[56px]",
                  "transition-colors duration-200 relative",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {/* Active indicator: top border */}
                {active && (
                  <span className="absolute top-0 inset-x-4 h-0.5 rounded-full bg-primary" />
                )}
                <Icon
                  className={cn("h-5 w-5 transition-transform duration-200", active && "scale-110")}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                <span className={cn(
                  "text-[10px] font-bold tracking-wide transition-colors duration-200",
                  active ? "text-primary" : "text-muted-foreground"
                )}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// ── Main BottomNav — switches based on theme ───────────────────────
export function BottomNav() {
  const { view, navigate, theme } = useApp();
  const current = view.name;

  const onNav = (id: string) => navigate({ name: id as any });

  if (theme === "pfm") {
    return <PfmNav current={current} onNav={onNav} />;
  }
  return <DefaultNav current={current} onNav={onNav} />;
}
