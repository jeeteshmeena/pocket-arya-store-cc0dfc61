import { createFileRoute } from "@tanstack/react-router";
import { AryaApp } from "@/components/arya/AryaApp";

export const Route = createFileRoute("/")({
  component: AryaApp,
});
