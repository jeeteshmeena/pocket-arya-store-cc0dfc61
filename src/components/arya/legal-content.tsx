// ═══════════════════════════════════════════════════════════
// TERMS & CONDITIONS — Arya Premium
// ═══════════════════════════════════════════════════════════
export const TERMS_TEXT = `TERMS & CONDITIONS
Last updated: May 2025

Welcome to Arya Premium ("the App"), a Telegram Mini App for purchasing and accessing premium audio story content. By using this App, you agree to be bound by these Terms & Conditions.

──────────────────────────────────────
1. ACCEPTANCE OF TERMS
──────────────────────────────────────
By tapping "Accept & Continue," you confirm that you have read, understood, and agree to these Terms. If you do not agree, please do not use this App.

──────────────────────────────────────
2. CONTENT LICENSE
──────────────────────────────────────
All stories, audio content, and media are licensed for personal, non-commercial use only.

You may NOT:
• Redistribute, resell, or share purchased content
• Use content for public broadcast or commercial purposes
• Attempt to download, copy, or extract audio files
• Upload content to any third-party platform

──────────────────────────────────────
3. ACCOUNT & IDENTITY
──────────────────────────────────────
Your Telegram account is your identity on this platform. You are solely responsible for maintaining the security of your Telegram account. We are not liable for unauthorized access due to compromised Telegram credentials.

──────────────────────────────────────
4. PURCHASES & PRICING
──────────────────────────────────────
• All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes
• Prices are subject to change at any time without prior notice
• Once purchased, access to content is tied to your Telegram account permanently
• We reserve the right to withdraw or modify content, but purchased content remains accessible

──────────────────────────────────────
5. PAYMENT — POWERED BY RAZORPAY
──────────────────────────────────────
All payments are processed securely by Razorpay Payments Pvt. Ltd., a PCI-DSS compliant payment gateway.

Accepted payment methods:
• UPI (GPay, PhonePe, Paytm, BHIM, and all UPI apps)
• Credit Cards (Visa, Mastercard, RuPay, Amex)
• Debit Cards
• Net Banking (all major banks)
• Mobile Wallets
• EMI (on eligible cards)

Payment security:
• Arya Premium does NOT store your card or UPI details
• All transactions are 256-bit SSL encrypted
• By completing payment, you also agree to Razorpay's Terms of Service (razorpay.com/terms)

Payment processing notes:
• UPI payments are typically confirmed within 30–60 seconds
• Card/Net Banking payments may take up to 2 minutes to confirm
• Do NOT close the app or press back during payment
• If payment is deducted but stories are not delivered within 24 hours, contact our support

Failed transactions:
• If a payment fails after deduction, Razorpay automatically initiates a reversal
• Reversal timeline: UPI (instant to 3 days), Cards (5–10 business days), Net Banking (3–7 days)
• You will NOT be charged twice for a failed transaction

──────────────────────────────────────
6. DELIVERY
──────────────────────────────────────
After successful payment, stories are delivered via our official Telegram bot (@UseAryaBot). Delivery is typically instant (within minutes). If you do not receive your content within 24 hours, contact Admin Support with your Order ID.

──────────────────────────────────────
7. ACCEPTABLE USE
──────────────────────────────────────
You agree NOT to:
• Misuse, abuse, or circumvent the service
• Attempt to reverse-engineer the app or its APIs
• Use bots, scripts, or automation to access the service
• Infringe upon any intellectual property rights
• Create fake orders or fraudulent payment attempts

We reserve the right to suspend or terminate access for violations.

──────────────────────────────────────
8. DISCLAIMER
──────────────────────────────────────
The service is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from the use of this App.

──────────────────────────────────────
9. GOVERNING LAW
──────────────────────────────────────
These Terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in India.

──────────────────────────────────────
10. CHANGES TO TERMS
──────────────────────────────────────
We may update these Terms periodically. Continued use of the App after changes constitutes acceptance of the updated Terms.

──────────────────────────────────────
CONTACT
──────────────────────────────────────
For any queries or concerns, contact us via Admin Support in the Profile tab or reach us at @UseAryaBot on Telegram.`;


// ═══════════════════════════════════════════════════════════
// REFUND POLICY — Arya Premium
// ═══════════════════════════════════════════════════════════
export const REFUND_TEXT = `REFUND POLICY
Last updated: May 2025

At Arya Premium, all sales of digital content are generally final due to the instant, non-returnable nature of digital goods. However, we are committed to fair treatment and will consider refund requests in the following circumstances.

──────────────────────────────────────
ELIGIBLE REFUND CONDITIONS
──────────────────────────────────────
We will process a full refund if:

1. Non-delivery: Your story was not delivered within 24 hours of a confirmed payment, and we are unable to deliver it.

2. Duplicate charge: You were charged more than once for the same story in the same session.

3. Corrupted content: The audio file delivered is corrupted or completely unplayable, AND re-delivery fails.

4. Technical error: A verified technical error on our end resulted in an incorrect charge.

──────────────────────────────────────
NOT ELIGIBLE FOR REFUND
──────────────────────────────────────
Refunds will NOT be issued for:

• Change of mind after purchase
• Content already listened to or accessed
• Purchases made on a different Telegram account
• Incompatibility with a specific device or app
• Requests submitted after 7 days of purchase
• Situations where content was already re-delivered successfully

──────────────────────────────────────
RAZORPAY PAYMENT REFUNDS
──────────────────────────────────────
All refunds for Razorpay payments are credited back to the original payment method:

• UPI: Instantly to 3 business days
• Credit/Debit Card: 5–10 business days (depends on your bank)
• Net Banking: 3–7 business days
• Wallets: 1–3 business days

Failed payment reversals are handled automatically by Razorpay. You do not need to contact us for these.

──────────────────────────────────────
HOW TO REQUEST A REFUND
──────────────────────────────────────
1. Go to Profile → Admin Support
2. Send your request with:
   • Your Telegram username
   • Order ID (found in Checkout success screen)
   • Reason for refund
   • Screenshot (if applicable)

Requests must be submitted within 7 days of purchase. We aim to respond within 48 hours.

──────────────────────────────────────
ABUSE POLICY
──────────────────────────────────────
We reserve the right to decline refunds and suspend accounts that show patterns of abuse, including repeated refund requests or fraudulent claims.`;


// ═══════════════════════════════════════════════════════════
// FAQ
// ═══════════════════════════════════════════════════════════
export const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "How do I purchase a story?",
    a: "Browse stories, add them to cart, then tap Checkout. Pay securely via Razorpay (UPI, Cards, Net Banking). Stories are delivered instantly to your Telegram via @UseAryaBot.",
  },
  {
    q: "Which payment methods are accepted?",
    a: "We accept UPI (GPay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking, Mobile Wallets, and EMI on eligible cards — all via Razorpay.",
  },
  {
    q: "Is my payment information safe?",
    a: "Yes. Arya Premium does not store any card or UPI details. All payments are processed by Razorpay, a PCI-DSS compliant, RBI-regulated payment gateway with 256-bit SSL encryption.",
  },
  {
    q: "Where do I receive my purchased stories?",
    a: "After payment, open @UseAryaBot on Telegram. Your stories will be delivered there automatically. You can also view them in the My Stories tab of this App.",
  },
  {
    q: "My payment was deducted but I didn't receive the story. What do I do?",
    a: "Wait 5–10 minutes and refresh the My Stories tab. If still not received after 24 hours, contact Admin Support from Profile with your Order ID and payment screenshot.",
  },
  {
    q: "What is the difference between Completed and Ongoing?",
    a: "Completed means the full story series is available for download in one go. Ongoing means episodes are still being added — you get all currently available episodes and may receive future updates.",
  },
  {
    q: "Can I listen on multiple devices?",
    a: "Your purchase is tied to your Telegram account. You can access content on any device where you're logged into the same Telegram account.",
  },
  {
    q: "Can I share my purchased stories?",
    a: "No. Content is licensed for personal use only. Sharing, reselling, or redistributing purchased content is strictly prohibited and may result in account suspension.",
  },
  {
    q: "How do refunds work?",
    a: "Refunds are available within 7 days for non-delivery or technical issues. Razorpay refunds are credited back to your original payment method (UPI: 1–3 days, Cards: 5–10 days).",
  },
  {
    q: "How does Refer & Earn work?",
    a: "Coming soon — you'll be able to invite friends and earn credits toward future purchases.",
  },
];


// ═══════════════════════════════════════════════════════════
// ABOUT — Matches Arya Premium Bot content exactly
// ═══════════════════════════════════════════════════════════
export const ABOUT_TEXT = `⟦ ABOUT ARYA PREMIUM ⟧

Welcome to Arya Premium — the ultimate, fully automated storefront for exclusive, high-quality stories.

──────────────────────────────────────
WHAT IT IS
──────────────────────────────────────
Arya Premium is a state-of-the-art paid content delivery ecosystem. It enables users to browse, purchase, and instantly receive premium stories without any manual intervention.

──────────────────────────────────────
HOW IT WORKS
──────────────────────────────────────
• Browse the Marketplace to find your desired story.
• Make a secure payment via Razorpay (UPI, Cards, Net Banking, Wallets).
• Upon successful validation, your story is delivered instantly to your Telegram via @UseAryaBot.

──────────────────────────────────────
CORE FEATURES
──────────────────────────────────────
• Instant Access: The moment your payment is verified, the content is unlocked forever.
• Permanent Library: All your purchases are safely stored in My Stories. You never lose access.
• Seamless Experience: Clean UI, fast response times, and high-quality file delivery.
• Bot + App Sync: Stories purchased from the bot and from the mini app are merged in one library.

──────────────────────────────────────
⟦ ABOUT ARYA BOT (PARENT) ⟧
──────────────────────────────────────

Arya Premium is proudly powered by the Main Arya Bot architecture — a trusted name in Telegram automation.

WHAT IT IS
──────────────────────────────────────
The parent Arya Bot is a highly advanced file management and delivery juggernaut, built to handle massive loads and complex operations.

WHY CHOOSE US
──────────────────────────────────────
• Instant Delivery: High-speed servers ensure files are forwarded to you with zero lag.
• Fully Automatic: No waiting for human admins. Everything is handled securely by code.
• Trusted Service: Used by thousands to manage and deliver files reliably every single day.

FEATURES
──────────────────────────────────────
• Batch Links: Group hundreds of files securely for public or private sharing.
• Live Sync: Real-time mirroring across multiple channels.
• Smart Management: Auto-approve logic, Force Subscribe walls, and deep user analytics.

──────────────────────────────────────
APP INFO
──────────────────────────────────────
Version:          1.0.0
Type:             Telegram Mini App
Bot:              @UseAryaBot
Payment Partner:  Razorpay Payments Pvt. Ltd.
Content:          Pocket FM · Kuku FM · Headphone & More

Disclaimer: Arya Premium is not affiliated with Pocket FM, Kuku FM, or any audio platform. All content rights belong to their respective owners. We act as a licensed reseller of digital content.`;

