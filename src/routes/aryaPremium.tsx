import { createFileRoute } from "@tanstack/react-router";
import { AryaApp } from "@/components/arya/AryaApp";

// Telegram BotFather is configured to open the Mini App at /aryaPremium.
// This route mounts the same app so the launch URL matches on every host
// (Lovable preview, lovable.app, custom domain, Vercel) without relying on
// host-level rewrites.
export const Route = createFileRoute("/aryaPremium")({
  component: AryaApp,
});
