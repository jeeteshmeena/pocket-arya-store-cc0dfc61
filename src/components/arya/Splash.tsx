import aryaLogo from "@/assets/arya-logo.jpg";

export function Splash() {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background">
      <img
        src={aryaLogo}
        alt="Arya Premium"
        className="h-[72px] w-[72px] rounded-2xl object-cover shadow-sm"
        fetchPriority="high"
        decoding="sync"
      />
    </div>
  );
}
