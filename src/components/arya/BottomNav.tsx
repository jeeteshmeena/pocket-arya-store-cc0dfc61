import { Home, Compass, Library, User } from "lucide-react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

// Filled variants for active state (iOS style)
const HOME_FILLED = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a2 2 0 002 2h3a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h3a2 2 0 002-2v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
  </svg>
);
const EXPLORE_FILLED = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-5l4-2-4-2v5l-4 2 4 2z" />
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.17 6.83l-2.5 5.83-5.83 2.5 2.5-5.83 5.83-2.5z"/>
  </svg>
);
const LIBRARY_FILLED = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"/>
  </svg>
);
const PROFILE_FILLED = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
  </svg>
);

const TABS = [
  { id: "home",      label: "Home",    Icon: Home,    IconFilled: HOME_FILLED },
  { id: "explore",   label: "Explore", Icon: Compass, IconFilled: EXPLORE_FILLED },
  { id: "mystories", label: "Library", Icon: Library, IconFilled: LIBRARY_FILLED },
  { id: "profile",   label: "Profile", Icon: User,    IconFilled: PROFILE_FILLED },
] as const;

// Legacy alias so other navs still work
const DEFAULT_TABS = TABS;

function DefaultNav({ current, onNav }: { current: string; onNav: (id: string) => void }) {
  const { t } = useApp();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-background border-t border-border"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 4px)" }}
    >
      <div className="mx-auto max-w-2xl flex items-stretch justify-around">
        {DEFAULT_TABS.map(({ id, label, Icon }) => {
          const active = current === id;
          const localizedLabel = id === "mystories" ? t("nav.library") : t(`nav.${id}`);
          return (
            <button
              key={id}
              onClick={() => onNav(id)}
              aria-label={localizedLabel}
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
                {localizedLabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ── TEAL — Premium dark dock with glow indicator (unique) ─────────
function TealNav({ current, onNav }: { current: string; onNav: (id: string) => void }) {
  const { t } = useApp();
  return (
    <nav
      className="fixed inset-x-0 z-40 flex justify-center pointer-events-none"
      style={{ bottom: "max(env(safe-area-inset-bottom), 14px)" }}
    >
      <div
        className="pointer-events-auto mx-4 px-3 py-2.5 rounded-[28px] flex items-center gap-2 relative"
        style={{
          background: "linear-gradient(160deg, rgba(14,54,54,0.92) 0%, rgba(8,32,32,0.92) 100%)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(23,162,184,0.25)",
          boxShadow: "0 16px 40px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {DEFAULT_TABS.map(({ id, label, Icon }) => {
          const active = current === id;
          const localizedLabel = id === "mystories" ? t("nav.library") : t(`nav.${id}`);
          return (
            <button
              key={id}
              onClick={() => onNav(id)}
              aria-label={localizedLabel}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative h-12 flex flex-col items-center justify-center transition-all duration-300 active:scale-90 px-3.5",
                active ? "text-white" : "text-white/55 hover:text-white/85"
              )}
            >
              {active && (
                <span
                  className="absolute -top-2 left-1/2 -translate-x-1/2 h-1 w-7 rounded-full"
                  style={{ background: "var(--color-primary)", boxShadow: "0 0 12px var(--color-primary)" }}
                />
              )}
              <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.6 : 1.8} />
              <span className={cn("text-[9px] mt-0.5 tracking-wider uppercase font-semibold", active ? "opacity-100" : "opacity-70")}>
                {localizedLabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ── MINT — Soft floating dock with leaf-curve indicator (unique) ──
function MintNav({ current, onNav }: { current: string; onNav: (id: string) => void }) {
  const { t } = useApp();
  return (
    <nav
      className="fixed inset-x-0 z-40 flex justify-center pointer-events-none"
      style={{ bottom: "max(env(safe-area-inset-bottom), 14px)" }}
    >
      <div
        className="pointer-events-auto mx-4 px-2 py-2 flex items-center gap-1 rounded-[32px]"
        style={{
          background: "linear-gradient(180deg, #FFFFFF 0%, #F4FBF8 100%)",
          border: "1px solid #DCEEE5",
          boxShadow: "0 18px 44px -16px rgba(31,191,122,0.35), 0 2px 8px rgba(11,31,42,0.06), inset 0 1px 0 #FFFFFF",
        }}
      >
        {DEFAULT_TABS.map(({ id, label, Icon }) => {
          const active = current === id;
          const localizedLabel = id === "mystories" ? t("nav.library") : t(`nav.${id}`);
          return (
            <button
              key={id}
              onClick={() => onNav(id)}
              aria-label={localizedLabel}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative h-12 flex items-center justify-center transition-all duration-300 active:scale-90",
                active ? "px-4 gap-2" : "w-12"
              )}
              style={
                active
                  ? {
                      background: "linear-gradient(135deg, #1FBF7A 0%, #16A86A 100%)",
                      color: "#FFFFFF",
                      borderRadius: "20px",
                      boxShadow: "0 8px 18px -6px rgba(31,191,122,0.55), inset 0 1px 0 rgba(255,255,255,0.25)",
                    }
                  : { color: "#5A6B7B" }
              }
            >
              <Icon className="h-[20px] w-[20px]" strokeWidth={active ? 2.6 : 1.9} />
              {active && (
                <span className="text-[12px] font-bold tracking-tight whitespace-nowrap">{localizedLabel}</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ── PILL — Floating glass pill nav (Cream, Dark, Romantic) ──
function PillNav({ current, onNav }: { current: string; onNav: (id: string) => void }) {
  const { theme, t } = useApp();
  const isCream = theme === "cream";
  const isDark = theme === "dark";
  const isRomantic = theme === "romantic";

  return (
    <nav
      className="fixed inset-x-0 z-40 flex justify-center pointer-events-none"
      style={{ bottom: "max(env(safe-area-inset-bottom), 12px)" }}
    >
      <div className={cn(
        "pointer-events-auto mx-4 flex items-center gap-1 px-2 py-2",
        isCream
          ? "neo-card bg-surface shadow-[4px_4px_0px_#000] border-2 border-black"
          : isDark
            ? "rounded-2xl bg-surface/80 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            : isRomantic
              ? "rounded-[26px] border"
              : "rounded-2xl bg-surface/90 backdrop-blur-xl border border-border shadow-[0_12px_40px_-12px_rgba(0,0,0,0.25)]"
      )}
        style={isRomantic ? {
          background: "linear-gradient(160deg, rgba(58,20,36,0.92) 0%, rgba(31,9,19,0.92) 100%)",
          backdropFilter: "blur(20px)",
          borderColor: "rgba(232,93,138,0.35)",
          boxShadow: "0 18px 48px -12px rgba(0,0,0,0.6), 0 0 30px -10px rgba(232,93,138,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        } : undefined}
      >
        {DEFAULT_TABS.map(({ id, label, Icon }) => {
          const active = current === id;
          const localizedLabel = id === "mystories" ? t("nav.library") : t(`nav.${id}`);
          return (
            <button
              key={id}
              onClick={() => onNav(id)}
              aria-label={localizedLabel}
              aria-current={active ? "page" : undefined}
              className={cn(
                "h-12 flex items-center gap-2.5 transition-all duration-300 active:scale-95",
                active
                  ? (isCream ? "neo-button bg-secondary text-secondary-foreground px-4 shadow-[2px_2px_0px_#000]"
                     : isDark ? "rounded-xl bg-white text-black px-4 shadow-lg"
                     : isRomantic ? "rounded-2xl px-4"
                     : "rounded-xl bg-primary text-primary-foreground px-4 shadow-md")
                  : (isCream ? "rounded-xl w-12 justify-center text-foreground hover:bg-muted"
                     : isRomantic ? "rounded-xl w-12 justify-center text-rose-100/60 hover:text-rose-100"
                     : "rounded-xl w-12 justify-center text-muted-foreground hover:text-foreground")
              )}
              style={active && isRomantic ? {
                background: "linear-gradient(135deg, #E85D8A 0%, #C4456E 100%)",
                color: "#FFFFFF",
                boxShadow: "0 8px 20px -6px rgba(232,93,138,0.6), inset 0 1px 0 rgba(255,255,255,0.2)",
              } : undefined}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.5 : 1.8} />
              {active && (
                <span className="text-[13px] font-bold tracking-tight whitespace-nowrap">
                  {localizedLabel}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ── DARK — Clean iOS-style full-width nav with filled active icons ──
function DarkNav({ current, onNav }: { current: string; onNav: (id: string) => void }) {
  const { t } = useApp();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40"
      style={{
        background: "#111111",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        paddingBottom: "max(env(safe-area-inset-bottom), 6px)",
        paddingTop: "8px",
      }}
    >
      <div className="mx-auto max-w-2xl flex items-stretch justify-around px-2">
        {TABS.map(({ id, label, Icon, IconFilled }) => {
          const active = current === id;
          const ActiveIcon = IconFilled;
          const localizedLabel = id === "mystories" ? t("nav.library") : t(`nav.${id}`);
          return (
            <button
              key={id}
              onClick={() => onNav(id)}
              aria-label={localizedLabel}
              aria-current={active ? "page" : undefined}
              className="relative flex flex-col items-center justify-center flex-1 py-1 gap-0.5 active:opacity-70 transition-opacity"
            >
              {active
                ? <ActiveIcon className="h-[24px] w-[24px]" style={{ color: "#ffffff" }} />
                : <Icon className="h-[24px] w-[24px]" strokeWidth={1.8} style={{ color: "rgba(255,255,255,0.45)" }} />}
              <span
                className="text-[10px] font-semibold tracking-wide"
                style={{ color: active ? "#ffffff" : "rgba(255,255,255,0.45)" }}
              >
                {localizedLabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

import { haptics } from "@/lib/haptics";

export function BottomNav() {
  const { view, navigate, theme } = useApp();
  const current = view.name;
  const onNav = (id: string) => {
    if (id !== current) haptics.light();
    navigate({ name: id as any });
  };

  if (theme === "dark") return <DarkNav current={current} onNav={onNav} />;
  if (theme === "teal") return <TealNav current={current} onNav={onNav} />;
  if (theme === "mint") return <MintNav current={current} onNav={onNav} />;
  if (theme === "cream" || theme === "romantic") return <PillNav current={current} onNav={onNav} />;
  return <DefaultNav current={current} onNav={onNav} />;
}
