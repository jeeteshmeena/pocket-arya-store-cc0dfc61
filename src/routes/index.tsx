import { createFileRoute } from "@tanstack/react-router";
import { AryaApp } from "@/components/arya/AryaApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Arya Premium — Audiobook Stories" },
      { name: "description", content: "Browse and purchase premium audiobook stories. Delivered via Telegram bot." },
      { property: "og:title", content: "Arya Premium" },
      { property: "og:description", content: "Premium audiobook stories marketplace." },
    ],
  }),
  component: AryaApp,
});
