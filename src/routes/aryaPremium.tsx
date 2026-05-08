import { createFileRoute } from "@tanstack/react-router";
import { AryaApp } from "@/components/arya/AryaApp";

/**
 * Route: /aryaPremium
 *
 * This is the REAL Telegram Mini App route.
 * BotFather URL: https://aryapremium.store/aryaPremium
 *
 * Supports:
 *   /aryaPremium
 *   /aryaPremium?story=id
 *   /aryaPremium?tgWebAppStartParam=...
 *   /aryaPremium?tgWebAppData=...  (Telegram adds this as query params in some clients)
 *
 * Query params are handled inside AryaApp / app-store.tsx — not here.
 * This route simply mounts the full Mini App shell.
 */
export const Route = createFileRoute("/aryaPremium")({
  component: AryaApp,
});
