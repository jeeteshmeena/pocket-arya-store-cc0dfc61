import { Outlet, createRootRoute } from "@tanstack/react-router";
import { AryaApp } from "@/components/arya/AryaApp";

/**
 * Smart NotFound component:
 * - If the URL looks like it could be a Telegram Mini App context
 *   (contains "aryaPremium" or has tgWebApp params), render AryaApp.
 * - Otherwise show a clean 404 for genuinely unknown routes.
 *
 * This handles Telegram edge cases like:
 *   /aryaPremium/          ← trailing slash variant
 *   /aryaPremium?tgWebAppData=...  ← Telegram query injection
 *   /aryaPremium#tgWebApp...       ← hash-based Telegram params
 */
function NotFoundComponent() {
  // Check if this looks like a Telegram Mini App URL
  const path     = window.location.pathname;
  const search   = window.location.search;
  const isMiniApp = (
    path.includes("aryaPremium") ||
    search.includes("tgWebApp") ||
    search.includes("tgWebAppData") ||
    search.includes("tgWebAppStartParam")
  );

  if (isMiniApp) {
    // Render the Mini App directly — never show 404 to Telegram users
    return <AryaApp />;
  }

  // Genuine 404 for unknown website routes
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  return <Outlet />;
}
