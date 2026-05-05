import { useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { TERMS_TEXT } from "./legal-content";

const STORAGE_KEY = "arya_tc_accepted";

export function TermsOnboarding() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const accepted = localStorage.getItem(STORAGE_KEY) === "1";
      if (!accepted) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setOpen(false);
  };

  return (
    <DialogPrimitive.Root open={open}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-fade-in" />
        <DialogPrimitive.Content
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="fixed left-[50%] top-[50%] z-50 w-[calc(100%-2rem)] max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-border bg-surface p-5 shadow-xl animate-sheet-up"
        >
          <DialogPrimitive.Title className="font-display text-lg font-semibold">
            Terms & Conditions
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="text-xs text-muted-foreground mt-1">
            Please review and accept to continue.
          </DialogPrimitive.Description>
          <ScrollArea className="mt-3 h-[45vh] rounded-xl bg-background/50 p-3">
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {TERMS_TEXT}
            </p>
          </ScrollArea>
          <Button onClick={accept} className="w-full mt-4 rounded-xl">
            Accept & Continue
          </Button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
