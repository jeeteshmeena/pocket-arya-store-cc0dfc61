import { Home, Compass, Library, User, Headphones, BookOpen } from "lucide-react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

// ── DEFAULT — Minimal white nav, black active ──────────────────
const DEFAULT_TABS = [
  { id: "home",      label: "Home",    icon: Home },
  { id: "explore",   label: "Explore", icon: Compass },
  { id: "mystories", label: "Library", icon: Library },
  { id: "profile",   label: "Profile", icon: User },
] as const;

function DefaultNav({ current, onNav }: { current: string; onNav: (id: string) => void }) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-background border-t border-border"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 4px)" }}
    >
      <div className="mx-auto max-w-2xl flex items-stretch justify-around">
        {DEFAULT_TABS.map(({ id, label, icon: Icon }) => {
          const active = current === id;
          return (
            <button
              key={id}
              onClick={() => onNav(id)}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center flex-1 pt-3 pb-2 gap-1 transition-colors duration-150",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {/* Active: small black dot indicator above icon */}
              <div className="relative">
                {active && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-foreground" />
                )}
                <Icon
                  className="h-[20px] w-[20px]"
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </div>
              <span className={cn(
                "text-[10px] tracking-wide",
                active ? "font-bold text-foreground" : "font-medium text-muted-foreground"
              )}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ── POCKET FM — Flat white bar, icon + label, black active ────
const PFM_TABS = [
  { id: "home",      label: "HOME",    icon: Home },
  { id: "explore",   label: "DISCOVER",icon: Headphones },
  { id: "mystories", label: "LIBRARY", icon: BookOpen },
  { id: "profile",   label: "PROFILE", icon: User },
] as const;

function PfmNav({ current, onNav }: { current: string; onNav: (id: string) => void }) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-border"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 4px)" }}
    >
      {/* Thin top border only — no floating, no shadow */}
      <div className="mx-auto max-w-2xl flex items-stretch justify-around">
        {PFM_TABS.map(({ id, label, icon: Icon }) => {
          const active = current === id;
          return (
            <button
              key={id}
              onClick={() => onNav(id)}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className="flex flex-col items-center justify-center flex-1 pt-3 pb-2 gap-1 transition-colors duration-150"
            >
              <Icon
                className={cn(
                  "h-[22px] w-[22px] transition-colors duration-150",
                  active ? "text-[#111111]" : "text-[#9CA3AF]"
                )}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className={cn(
                "text-[9px] tracking-widest",
                active ? "font-black text-[#111111]" : "font-medium text-[#9CA3AF]"
              )}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function BottomNav() {
  const { view, navigate, theme } = useApp();
  const current = view.name;
  const onNav = (id: string) => navigate({ name: id as any });

  if (theme === "pfm") return <PfmNav current={current} onNav={onNav} />;
  return <DefaultNav current={current} onNav={onNav} />;
}
