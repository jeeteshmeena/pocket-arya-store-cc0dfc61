import { useApp } from "@/store/app-store";
import { formatPrice } from "@/lib/currency";

/**
 * Returns a formatter function that converts an INR price to the user's selected currency.
 * Usage:
 *   const fmt = usePriceFormat();
 *   fmt(story.price)  // → "₹99" or "$1.19" etc.
 */
export function usePriceFormat() {
  const { currency } = useApp();
  return (inrAmount: number | string | undefined | null) => {
    const amount = Number(inrAmount ?? 0);
    if (isNaN(amount)) return "";
    return formatPrice(amount, currency);
  };
}
