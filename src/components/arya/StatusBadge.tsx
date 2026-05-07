import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Status badge — by default shows ONLY a colored pulsing dot.
 * After mounting (300ms), it smoothly expands to reveal the label.
 * Use `expanded` prop to force always-expanded (e.g., on detail view).
 */
export function StatusBadge({
  isCompleted,
  expanded,
  size = "sm",
}: {
  isCompleted: boolean;
  expanded?: boolean;
  size?: "sm" | "md";
}) {
  const [showLabel, setShowLabel] = useState(!!expanded);

  useEffect(() => {
    if (expanded) {
      setShowLabel(true);
      return;
    }
    // After a brief delay, expand label smoothly (so the user "sees" it appear)
    const t = setTimeout(() => setShowLabel(true), 350);
    return () => clearTimeout(t);
  }, [expanded]);

  const dotColor = isCompleted ? "text-emerald-500" : "text-orange-500";
  const textColor = isCompleted ? "text-emerald-700" : "text-orange-700";
  const label = isCompleted ? "Completed" : "Ongoing";
  const dotSize = size === "md" ? "h-2.5 w-2.5" : "h-2 w-2";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-background/95 backdrop-blur-md border border-border/60 shadow-sm overflow-hidden transition-all duration-500 ease-out",
        showLabel ? "pl-1.5 pr-2 py-0.5" : "p-1"
      )}
      style={{ maxWidth: showLabel ? 140 : 18 + (size === "md" ? 4 : 0) }}
    >
      <span className={cn("relative inline-block rounded-full shrink-0", dotSize, dotColor)}>
        <span className="status-pulse" />
        <span className={cn("absolute inset-0 rounded-full bg-current")} />
      </span>
      <span
        className={cn(
          "text-[9px] font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-500 ease-out",
          textColor,
          showLabel ? "opacity-100 translate-x-0 max-w-[120px]" : "opacity-0 -translate-x-1 max-w-0"
        )}
      >
        {label}
      </span>
    </div>
  );
}
