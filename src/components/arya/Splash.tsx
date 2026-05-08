import aryaLogo from "@/assets/arya-logo.jpg";
import { useEffect, useState } from "react";

export function Splash() {
  const [phase, setPhase] = useState<0 | 1 | 2>(0);

  // Fast phased reveal: logo (0) → text (1) → bar (2)
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 250);
    const t2 = setTimeout(() => setPhase(2), 550);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none transition-opacity duration-700"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
          opacity: phase >= 1 ? 0.18 : 0,
        }}
      />

      {/* Logo container */}
      <div className="relative flex items-center justify-center">
        {/* Rotating ring */}
        <div
          className="absolute inset-[-10px] rounded-full border border-primary/20"
          style={{
            animation: phase >= 1 ? "spin 3s linear infinite" : "none",
          }}
        />
        {/* Pulse ring 1 */}
        <div
          className="absolute inset-[-4px] rounded-full border border-primary/30 transition-opacity duration-500"
          style={{ opacity: phase >= 1 ? 1 : 0 }}
        />

        {/* Logo */}
        <div
          className="relative h-[88px] w-[88px] rounded-2xl overflow-hidden shadow-2xl transition-all duration-500"
          style={{
            transform: phase >= 1 ? "scale(1)" : "scale(0.7)",
            opacity: phase >= 1 ? 1 : 0,
            boxShadow: phase >= 1
              ? "0 0 0 2px hsl(var(--primary)/0.3), 0 24px 48px -12px rgba(0,0,0,0.5)"
              : "none",
          }}
        >
          <img
            src={aryaLogo}
            alt="Arya Premium"
            className="h-full w-full object-cover"
            fetchPriority="high"
            decoding="sync"
          />
          {/* Shimmer */}
          <div
            className="absolute inset-0 opacity-0"
            style={{
              background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
              animation: phase >= 2 ? "shimmer 2s ease-in-out infinite" : "none",
            }}
          />
        </div>
      </div>

      {/* Text */}
      <div
        className="mt-7 text-center transition-all duration-500"
        style={{
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? "translateY(0)" : "translateY(8px)",
        }}
      >
        <div className="font-display font-black text-[26px] text-foreground tracking-tight leading-none">
          Arya<span style={{ color: "hsl(var(--primary))" }}>Premium</span>
        </div>
        <div className="mt-1.5 text-[10px] uppercase tracking-[0.35em] text-muted-foreground font-medium">
          Stories · Music · More
        </div>
      </div>

      {/* Loading bar */}
      <div
        className="mt-10 w-16 h-[2px] rounded-full bg-muted overflow-hidden transition-opacity duration-300"
        style={{ opacity: phase >= 2 ? 1 : 0 }}
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ animation: phase >= 2 ? "loadbar 1.4s ease-in-out infinite" : "none" }}
        />
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes shimmer {
          0% { opacity: 0; transform: translateX(-100%); }
          50% { opacity: 1; }
          100% { opacity: 0; transform: translateX(100%); }
        }
        @keyframes loadbar {
          0%   { width: 0%; margin-left: 0%; }
          50%  { width: 70%; margin-left: 15%; }
          100% { width: 0%; margin-left: 100%; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
