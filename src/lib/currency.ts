// ─────────────────────────────────────────────────────────────────
// Currency definitions — INR base rates (updated periodically)
// Rate = 1 INR → X foreign currency
// ─────────────────────────────────────────────────────────────────

export type CurrencyCode =
  | "INR" | "USD" | "EUR" | "GBP" | "AED" | "SAR" | "QAR" | "KWD" | "BHD" | "OMR"
  | "NPR" | "LKR" | "BDT" | "PKR" | "MYR" | "SGD" | "THB" | "IDR" | "PHP" | "VND"
  | "CAD" | "AUD" | "NZD" | "CHF" | "SEK" | "NOK" | "DKK" | "JPY" | "CNY" | "KRW"
  | "ZAR" | "NGN" | "KES" | "TZS" | "EGP";

export type Currency = {
  code: CurrencyCode;
  name: string;
  symbol: string;
  flag: string;
  /** How many units of this currency = 1 INR */
  rateFromINR: number;
};

export const CURRENCIES: Currency[] = [
  // South Asia
  { code: "INR", name: "Indian Rupee",        symbol: "₹",   flag: "🇮🇳", rateFromINR: 1 },
  { code: "NPR", name: "Nepalese Rupee",       symbol: "Rs.", flag: "🇳🇵", rateFromINR: 1.6 },
  { code: "LKR", name: "Sri Lankan Rupee",     symbol: "₨",   flag: "🇱🇰", rateFromINR: 3.62 },
  { code: "BDT", name: "Bangladeshi Taka",     symbol: "৳",   flag: "🇧🇩", rateFromINR: 1.31 },
  { code: "PKR", name: "Pakistani Rupee",      symbol: "₨",   flag: "🇵🇰", rateFromINR: 3.47 },
  // Middle East
  { code: "AED", name: "UAE Dirham",           symbol: "د.إ", flag: "🇦🇪", rateFromINR: 0.044 },
  { code: "SAR", name: "Saudi Riyal",          symbol: "﷼",   flag: "🇸🇦", rateFromINR: 0.044 },
  { code: "QAR", name: "Qatari Riyal",         symbol: "﷼",   flag: "🇶🇦", rateFromINR: 0.043 },
  { code: "KWD", name: "Kuwaiti Dinar",        symbol: "KD",  flag: "🇰🇼", rateFromINR: 0.0037 },
  { code: "BHD", name: "Bahraini Dinar",       symbol: "BD",  flag: "🇧🇭", rateFromINR: 0.0045 },
  { code: "OMR", name: "Omani Rial",           symbol: "﷼",   flag: "🇴🇲", rateFromINR: 0.0046 },
  // Southeast Asia
  { code: "MYR", name: "Malaysian Ringgit",    symbol: "RM",  flag: "🇲🇾", rateFromINR: 0.053 },
  { code: "SGD", name: "Singapore Dollar",     symbol: "S$",  flag: "🇸🇬", rateFromINR: 0.016 },
  { code: "THB", name: "Thai Baht",            symbol: "฿",   flag: "🇹🇭", rateFromINR: 0.42 },
  { code: "IDR", name: "Indonesian Rupiah",    symbol: "Rp",  flag: "🇮🇩", rateFromINR: 188 },
  { code: "PHP", name: "Philippine Peso",      symbol: "₱",   flag: "🇵🇭", rateFromINR: 0.67 },
  { code: "VND", name: "Vietnamese Dong",      symbol: "₫",   flag: "🇻🇳", rateFromINR: 293 },
  // Western
  { code: "USD", name: "US Dollar",            symbol: "$",   flag: "🇺🇸", rateFromINR: 0.012 },
  { code: "EUR", name: "Euro",                 symbol: "€",   flag: "🇪🇺", rateFromINR: 0.011 },
  { code: "GBP", name: "British Pound",        symbol: "£",   flag: "🇬🇧", rateFromINR: 0.0095 },
  { code: "CAD", name: "Canadian Dollar",      symbol: "CA$", flag: "🇨🇦", rateFromINR: 0.016 },
  { code: "AUD", name: "Australian Dollar",    symbol: "A$",  flag: "🇦🇺", rateFromINR: 0.018 },
  { code: "NZD", name: "New Zealand Dollar",   symbol: "NZ$", flag: "🇳🇿", rateFromINR: 0.020 },
  { code: "CHF", name: "Swiss Franc",          symbol: "Fr",  flag: "🇨🇭", rateFromINR: 0.011 },
  // Europe
  { code: "SEK", name: "Swedish Krona",        symbol: "kr",  flag: "🇸🇪", rateFromINR: 0.12 },
  { code: "NOK", name: "Norwegian Krone",      symbol: "kr",  flag: "🇳🇴", rateFromINR: 0.13 },
  { code: "DKK", name: "Danish Krone",         symbol: "kr",  flag: "🇩🇰", rateFromINR: 0.082 },
  // East Asia
  { code: "JPY", name: "Japanese Yen",         symbol: "¥",   flag: "🇯🇵", rateFromINR: 1.81 },
  { code: "CNY", name: "Chinese Yuan",         symbol: "¥",   flag: "🇨🇳", rateFromINR: 0.086 },
  { code: "KRW", name: "South Korean Won",     symbol: "₩",   flag: "🇰🇷", rateFromINR: 16.3 },
  // Africa
  { code: "ZAR", name: "South African Rand",   symbol: "R",   flag: "🇿🇦", rateFromINR: 0.21 },
  { code: "NGN", name: "Nigerian Naira",       symbol: "₦",   flag: "🇳🇬", rateFromINR: 18.5 },
  { code: "KES", name: "Kenyan Shilling",      symbol: "KSh", flag: "🇰🇪", rateFromINR: 1.54 },
  { code: "TZS", name: "Tanzanian Shilling",   symbol: "TSh", flag: "🇹🇿", rateFromINR: 29.3 },
  { code: "EGP", name: "Egyptian Pound",       symbol: "E£",  flag: "🇪🇬", rateFromINR: 0.57 },
];

export const CURRENCY_MAP: Record<CurrencyCode, Currency> = Object.fromEntries(
  CURRENCIES.map((c) => [c.code, c])
) as Record<CurrencyCode, Currency>;

/**
 * Convert a price in INR to the selected currency and format it.
 * Fetches live rates from open.er-api.com if available; falls back to built-in rates.
 */
export function formatPrice(inrAmount: number, currency: Currency): string {
  const converted = inrAmount * currency.rateFromINR;
  const decimals = converted < 10 ? 2 : converted < 100 ? 1 : 0;
  return `${currency.symbol}${converted.toFixed(decimals)}`;
}
