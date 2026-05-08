import { Outlet, createRootRoute } from "@tanstack/react-router";
import { AryaApp } from "@/components/arya/AryaApp";

export const Route = createRootRoute({
  component: RootComponent,
  // Mini App is single-view: any unmatched path (e.g. Telegram opening at a
  // path other than the one registered, in-app browser quirks, deep links
  // that include start_param/tgWebAppData) should boot the app instead of
  // showing a 404. This eliminates the "404 → Go Home" flash permanently.
  notFoundComponent: AryaApp,
});

function RootComponent() {
  return <Outlet />;
}
