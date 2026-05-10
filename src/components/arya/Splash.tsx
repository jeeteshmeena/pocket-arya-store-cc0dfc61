import aryaLogo from "@/assets/arya-logo.jpg";
import { useEffect, useState } from "react";

export function Splash() {
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 120);
    const t2 = setTimeout(() => setPhase(2), 480);
    const t3 = setTimeout(() => setPhase(3), 820);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden flex flex-col items-center justify-center bg-background">
      {/* Layered ambient gradients */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          opacity: phase >= 1 ? 1 : 0,
          background:
            "radial-gradient(60% 50% at 50% 35%, color-mix(in oklab, var(--color-primary) 22%, transparent) 0%, transparent 70%), radial-gradient(40% 40% at 70% 80%, color-mix(in oklab, var(--color-accent) 18%, transparent) 0%, transparent 70%)",
        }}
      />
      {/* Subtle grain */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* Logo stack */}
      <div className="relative flex items-center justify-center" style={{ width: 132, height: 132 }}>
        {/* Outer slow rotating conic ring */}
        <div
          className="absolute inset-0 rounded-full transition-opacity duration-500"
          style={{
            opacity: phase >= 1 ? 1 : 0,
            background:
              "conic-gradient(from 0deg, color-mix(in oklab, var(--color-primary) 70%, transparent), transparent 35%, color-mix(in oklab, var(--color-primary) 30%, transparent) 60%, transparent 80%, color-mix(in oklab, var(--color-primary) 70%, transparent))",
            animation: phase >= 1 ? "splash-spin 3.4s linear infinite" : "none",
            mask: "radial-gradient(circle, transparent 56%, #000 58%, #000 64%, transparent 66%)",
            WebkitMask: "radial-gradient(circle, transparent 56%, #000 58%, #000 64%, transparent 66%)",
          }}
        />
        {/* Pulsing rings */}
        <div
          className="absolute inset-3 rounded-full border"
          style={{
            borderColor: "color-mix(in oklab, var(--color-primary) 35%, transparent)",
            animation: phase >= 1 ? "splash-ping 2.4s var(--ease-out-expo) infinite" : "none",
          }}
        />
        <div
          className="absolute inset-5 rounded-full border"
          style={{
            borderColor: "color-mix(in oklab, var(--color-primary) 25%, transparent)",
            animation: phase >= 1 ? "splash-ping 2.4s var(--ease-out-expo) 0.6s infinite" : "none",
          }}
        />

        {/* Logo card */}
        <div
          className="relative h-[92px] w-[92px] rounded-[26px] overflow-hidden transition-all duration-700"
          style={{
            transform: phase >= 1 ? "scale(1) rotate(0deg)" : "scale(0.6) rotate(-8deg)",
            opacity: phase >= 1 ? 1 : 0,
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.18) inset, 0 0 0 1px color-mix(in oklab, var(--color-primary) 40%, transparent), 0 30px 60px -20px rgba(0,0,0,0.55), 0 0 60px -10px color-mix(in oklab, var(--color-primary) 55%, transparent)",
          }}
        >
          <img
            src={aryaLogo}
            alt="Arya Premium"
            className="h-full w-full object-cover"
            fetchPriority="high"
            decoding="sync"
          />
          {/* Sheen sweep */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(115deg, transparent 38%, rgba(255,255,255,0.28) 50%, transparent 62%)",
              transform: "translateX(-120%)",
              animation: phase >= 2 ? "splash-sheen 2.2s ease-in-out 0.4s infinite" : "none",
            }}
          />
        </div>
      </div>

      {/* Removed wordmark and progress bar as requested */}

      <style>{`
        @keyframes splash-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes splash-ping {
          0%   { transform: scale(0.85); opacity: 0.85; }
          80%  { transform: scale(1.55); opacity: 0; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        @keyframes splash-sheen {
          0%   { transform: translateX(-120%); }
          60%  { transform: translateX(120%); }
          100% { transform: translateX(120%); }
        }
        @keyframes splash-bar {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(360%); }
        }
      `}</style>
    </div>
  );
}
