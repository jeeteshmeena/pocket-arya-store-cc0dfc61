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
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="h-[92px] w-[92px] rounded-3xl overflow-hidden shadow-lg border border-border">
          <img
            src={aryaLogo}
            alt="Arya Premium"
            className="h-full w-full object-cover"
            fetchPriority="high"
            decoding="sync"
          />
        </div>
        
        {/* Simple standard loading spinner */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 rounded-full border-[3px] border-muted-foreground/30 border-t-primary animate-spin" />
          <span className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">Loading</span>
        </div>
      </div>
    </div>
  );
}
