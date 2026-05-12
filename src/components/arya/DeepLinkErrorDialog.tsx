import { AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useApp } from "@/store/app-store";

export function DeepLinkErrorDialog() {
  const { deepLinkError, clearDeepLinkError, t } = useApp();
  const open = deepLinkError !== null;

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && clearDeepLinkError()}>
      <AlertDialogContent className="max-w-sm rounded-2xl bg-surface border-border">
        <AlertDialogHeader>
          <div className="mx-auto h-12 w-12 grid place-items-center rounded-full bg-destructive/10 mb-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <AlertDialogTitle className="font-display text-center">{t("story.noFound")}</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {t("story.noFound")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={clearDeepLinkError} className="w-full rounded-full">
            {t("library.browse")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
