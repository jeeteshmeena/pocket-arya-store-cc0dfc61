import aryaLogo from "@/assets/arya-logo.jpg";

export function Splash() {
  return (
    <div className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center animate-fade-in">
      <div className="relative">
        <span className="absolute inset-0 rounded-full bg-primary/30 animate-splash-ring" />
        <span className="absolute inset-0 rounded-full bg-primary/20 animate-splash-ring" style={{ animationDelay: "0.5s" }} />
        <div className="relative h-24 w-24 rounded-full overflow-hidden ring-2 ring-primary/40 shadow-2xl animate-splash-pulse bg-muted">
          <img src={aryaLogo} alt="Arya" className="h-full w-full object-cover" />
        </div>
      </div>
      <div className="mt-8 font-display font-bold text-2xl text-foreground tracking-tight">Arya</div>
      <div className="mt-1 text-xs text-muted-foreground uppercase tracking-[0.3em]">Premium Stories</div>
    </div>
  );
}
