import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { STORIES } from "@/server/stories";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || "AryaPremiumBot";

export const Route = createFileRoute("/api/checkout")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.json().catch(() => ({}));
          const storyIds: unknown = body?.story_ids;
          if (!Array.isArray(storyIds) || storyIds.length === 0) {
            return new Response(
              JSON.stringify({ success: false, message: "story_ids is required" }),
              { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
            );
          }
          const ids = storyIds.filter((x): x is string => typeof x === "string");
          const valid = ids.filter((id) => STORIES.some((s) => s.id === id));
          if (valid.length === 0) {
            return new Response(
              JSON.stringify({ success: false, message: "No valid stories in cart" }),
              { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
            );
          }

          // In production: persist an order document in MongoDB and return its id.
          const orderId =
            "ord_" +
            Date.now().toString(36) +
            Math.random().toString(36).slice(2, 8);

          const checkoutUrl = `https://t.me/${BOT_USERNAME}?start=order_${orderId}`;

          return new Response(
            JSON.stringify({ success: true, order_id: orderId, checkout_url: checkoutUrl }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : "Checkout failed";
          return new Response(JSON.stringify({ success: false, message }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      },
    },
  },
});
