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

// ── PILL — Floating glass pill nav (Teal & Cream themes) ──────
function PillNav({ current, onNav }: { current: string; onNav: (id: string) => void }) {
  const { theme } = useApp();
  const isCream = theme === "cream";
  
  return (
    <nav
      className="fixed inset-x-0 z-40 flex justify-center pointer-events-none"
      style={{ bottom: "max(env(safe-area-inset-bottom), 12px)" }}
    >
      <div className={cn(
        "pointer-events-auto mx-4 flex items-center gap-1 px-2 py-2",
        isCream 
          ? "neo-card bg-surface shadow-[4px_4px_0px_#000] border-2 border-black"
          : "rounded-full bg-surface/90 backdrop-blur-xl border border-border shadow-[0_12px_40px_-12px_rgba(0,0,0,0.25)]"
      )}>
        {DEFAULT_TABS.map(({ id, label, icon: Icon }) => {
          const active = current === id;
          return (
            <button
              key={id}
              onClick={() => onNav(id)}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "h-11 flex items-center gap-2 transition-all duration-200 active:scale-95",
                active
                  ? (isCream ? "neo-button bg-secondary text-secondary-foreground px-4 shadow-[2px_2px_0px_#000]" : "rounded-full bg-primary text-primary-foreground px-4 shadow-md")
                  : (isCream ? "rounded-full w-11 justify-center text-foreground hover:bg-muted" : "rounded-full w-11 justify-center text-muted-foreground hover:text-foreground")
              )}
            >
              <Icon className="h-[20px] w-[20px] shrink-0" strokeWidth={active ? 2.4 : 1.9} />
              {active && (
                <span className="text-[12px] font-semibold tracking-tight whitespace-nowrap">
                  {label}
                </span>
              )}
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
  if (theme === "teal" || theme === "cream") return <PillNav current={current} onNav={onNav} />;
  return <DefaultNav current={current} onNav={onNav} />;
}
