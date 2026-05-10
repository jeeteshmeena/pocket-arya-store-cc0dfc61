/**
 * Row — Premium horizontal scroll row
 * Features: intersection-observer enter animation, stagger children,
 *           "See All" button, smooth 60fps scroll
 */
import { useRef, useEffect, useState, memo } from "react";
import type { Story } from "@/lib/data";
import { StoryCard } from "./StoryCard";
import { cn } from "@/lib/utils";
import { useApp } from "@/store/app-store";
import { ChevronRight } from "lucide-react";

export const Row = memo(function Row({
  title, stories, wide, onSeeAll,
}: {
  title: string;
  stories: Story[];
  wide?: boolean;
  onSeeAll?: () => void;
}) {
  const { theme } = useApp();
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  // Separate "near viewport" gate — mounts cards before the row scrolls in,
  // so images are queued ahead of time but never all at once at startup.
  const [mount, setMount] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obsMount = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setMount(true); obsMount.disconnect(); } },
      { rootMargin: "600px 0px" }
    );
    const obsAnim = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obsAnim.disconnect(); } },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    obsMount.observe(el);
    obsAnim.observe(el);
    return () => { obsMount.disconnect(); obsAnim.disconnect(); };
  }, []);

  if (!stories.length) return null;

  const titleClass = cn(
    "font-display tracking-tight text-foreground",
    theme === "cream"     && "text-[19px] font-extrabold",
    theme === "teal"      && "text-[18px] font-bold tracking-tight",
    theme === "romantic"  && "text-[18px] font-bold italic",
    !["cream","teal","romantic"].includes(theme) && "text-[15px] font-bold"
  );

  return (
    <section
      ref={ref}
      className="mt-3"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(14px)",
        transition: "opacity 380ms cubic-bezier(0.16,1,0.3,1), transform 380ms cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {/* Header row */}
      <div className="px-4 mb-3 flex items-center justify-between">
        <h2 className={titleClass}>{title}</h2>
        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="flex items-center gap-0.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            See All <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Scroll row */}
      <div
        className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1"
        style={{ WebkitOverflowScrolling: "touch", minHeight: (wide && theme !== "dark") ? 220 : 180 }}
      >
        {mount
          ? stories.map((s, i) => (
              <div
                key={s.id}
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateX(0)" : "translateX(12px)",
                  transition: `opacity 320ms ${Math.min(i, 6) * 40}ms ease, transform 320ms ${Math.min(i, 6) * 40}ms ease`,
                }}
              >
                <StoryCard story={s} wide={wide} enablePreview />
              </div>
            ))
          : stories.slice(0, 4).map((s) => (
              <div
                key={s.id}
                className={cn(
                  "shrink-0 rounded-[14px] shimmer-bg", 
                  theme === "dark" ? "w-[115px] aspect-square" : (wide ? "w-44 aspect-[4/5]" : "w-40 aspect-square")
                )}
                aria-hidden="true"
              />
            ))}
      </div>
    </section>
  );
});
