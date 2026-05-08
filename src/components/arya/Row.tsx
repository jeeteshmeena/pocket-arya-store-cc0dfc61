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

  // Intersection observer — animate in when row enters viewport
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
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
      className="mt-5"
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
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {stories.map((s, i) => (
          <div
            key={s.id}
            style={{
              // Stagger entry for each card
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : "translateX(12px)",
              transition: `opacity 320ms ${i * 40}ms ease, transform 320ms ${i * 40}ms ease`,
            }}
          >
            <StoryCard story={s} wide={wide} />
          </div>
        ))}
      </div>
    </section>
  );
});
