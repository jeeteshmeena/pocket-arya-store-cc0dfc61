/**
 * Row — Horizontal scroll section
 * Fixes: IntersectionObserver now starts visible=true immediately
 *        to avoid blank rows when already in viewport on mount.
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
  // Start visible=true — avoids blank rows that are already in viewport
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Only animate in if NOT already visible (below fold)
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      setVisible(true);
      return; // Already in viewport — skip observer
    }
    setVisible(false); // Will animate in when scrolled to
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.05 }  // No negative rootMargin — was cutting off nearby rows
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Never render empty rows
  if (!stories || stories.length === 0) return null;

  const titleClass = cn(
    "font-display tracking-tight text-foreground",
    theme === "cream"    && "text-[19px] font-extrabold",
    theme === "teal"     && "text-[18px] font-bold tracking-tight",
    theme === "romantic" && "text-[18px] font-bold italic",
    !["cream","teal","romantic"].includes(theme) && "text-[15px] font-bold"
  );

  return (
    <section
      ref={ref}
      className="mt-5"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 340ms ease, transform 340ms ease",
        willChange: "opacity, transform",
      }}
    >
      {/* Header */}
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

      {/* Horizontal scroll */}
      <div
        className="flex gap-3 overflow-x-auto px-4 pb-1"
        style={{
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {stories.map((s, i) => (
          <div
            key={s.id}
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : "translateX(10px)",
              transition: `opacity 280ms ${Math.min(i * 35, 280)}ms ease,
                           transform 280ms ${Math.min(i * 35, 280)}ms ease`,
            }}
          >
            {/* First 3 cards: priority load — already in viewport */}
            <StoryCard story={s} wide={wide} priority={i < 3} />
          </div>
        ))}

      </div>
    </section>
  );
});
