import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FAQ_ITEMS } from "./legal-content";

type Kind = "terms" | "refund" | "faq" | null;

export function InfoDialog({
  kind,
  onOpenChange,
  termsText,
  refundText,
}: {
  kind: Kind;
  onOpenChange: (open: boolean) => void;
  termsText: string;
  refundText: string;
}) {
  const open = kind !== null;
  const title =
    kind === "terms" ? "Terms & Conditions" : kind === "refund" ? "Refund Policy" : kind === "faq" ? "FAQ" : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] rounded-2xl bg-surface border-border">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
          <DialogDescription className="sr-only">{title}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-3">
          {kind === "faq" ? (
            <div className="space-y-4">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i}>
                  <div className="text-sm font-semibold">{item.q}</div>
                  <div className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.a}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {kind === "terms" ? termsText : kind === "refund" ? refundText : ""}
            </p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export type { Kind as InfoDialogKind };
