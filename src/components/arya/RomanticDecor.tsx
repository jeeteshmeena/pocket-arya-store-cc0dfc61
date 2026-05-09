import { useApp } from "@/store/app-store";
import { useMemo } from "react";
import { Heart, Sparkles, Flower2 } from "lucide-react";

/**
 * Floating romantic graphics — hearts, petals, sparkles.
 * Only renders when the active theme is "romantic".
 * Pointer-events disabled, low z-index so it never blocks UI.
 */
export function RomanticDecor() {
  const { theme } = useApp();

  const items = useMemo(() => {
    // Stable random distribution
    const rand = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    const types: Array<"heart" | "petal" | "sparkle"> = [];
    const arr: { type: "heart" | "petal" | "sparkle"; left: number; size: number; duration: number; delay: number }[] = [];
    for (let i = 0; i < 18; i++) {
      const t: "heart" | "petal" | "sparkle" =
        i % 3 === 0 ? "heart" : i % 3 === 1 ? "petal" : "sparkle";
      types.push(t);
      arr.push({
        type: t,
        left: rand(i + 1) * 100,
        size: 12 + rand(i + 7) * 14,
        duration: 14 + rand(i + 3) * 16,
        delay: rand(i + 11) * -20,
      });
    }
    return arr;
  }, []);

  if (theme !== "romantic") return null;

  return (
    <div className="romantic-decor" aria-hidden="true">
      {items.map((it, i) => {
        const style = {
          left: `${it.left}%`,
          width: it.size,
          height: it.size,
          animationDuration: `${it.duration}s`,
          animationDelay: `${it.delay}s`,
        } as React.CSSProperties;
        if (it.type === "heart")
          return <Heart key={i} className="heart" style={style} fill="currentColor" strokeWidth={0} />;
        if (it.type === "petal")
          return <Flower2 key={i} className="petal" style={style} fill="currentColor" strokeWidth={0} />;
        return <Sparkles key={i} className="sparkle" style={style} fill="currentColor" strokeWidth={0} />;
      })}
    </div>
  );
}
