import { Home, Compass, Library, User } from "lucide-react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "home", label: "Home", icon: Home },
  { id: "explore", label: "Explore", icon: Compass },
  { id: "mystories", label: "My Stories", icon: Library },
  { id: "profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const { view, navigate, theme } = useApp();
  const current = view.name;
  const isPfm = theme === "pfm";

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-2xl px-3 pb-3 pt-2">
        <div
          className={cn(
            "flex items-center justify-between gap-1",
            isPfm
              ? "rounded-full px-2 py-1.5 border border-white/10 bg-card/40 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_-12px_rgba(0,0,0,0.6)]"
              : "rounded-2xl px-1 py-1 bg-card/95 backdrop-blur-xl border border-border"
          )}
        >
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = current === t.id;
            return (
              <button
                key={t.id}
                onClick={() => navigate({ name: t.id as never })}
                aria-label={t.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center justify-center overflow-hidden",
                  "transition-all duration-300 ease-in-out",
                  "h-10 rounded-full",
                  active
                    ? "flex-[2] bg-primary text-primary-foreground px-3 gap-2"
                    : "flex-1 text-muted-foreground hover:text-foreground px-2",
                  !isPfm && active && "bg-primary/15 text-primary",
                  !isPfm && !active && "bg-transparent"
                )}
              >
                <Icon
                  className="h-[18px] w-[18px] shrink-0 transition-transform duration-300"
                  strokeWidth={active ? 2.4 : 1.9}
                />
                <span
                  className={cn(
                    "text-[12px] font-semibold whitespace-nowrap transition-all duration-300 ease-in-out",
                    active
                      ? "max-w-[120px] opacity-100 translate-x-0"
                      : "max-w-0 opacity-0 -translate-x-1"
                  )}
                >
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
