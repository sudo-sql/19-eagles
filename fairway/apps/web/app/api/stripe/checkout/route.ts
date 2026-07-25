import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: "Billing not configured" }, { status: 503 });
  const stripe = new Stripe(key);
  const form = await req.formData();
  const plan = form.get("plan") === "monthly" ? process.env.STRIPE_PRICE_MONTHLY : process.env.STRIPE_PRICE_ANNUAL;
  if (!plan) return NextResponse.json({ error: "Price not configured" }, { status: 503 });
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: plan, quantity: 1 }],
    success_url: `${req.nextUrl.origin}/account?upgraded=1`,
    cancel_url: `${req.nextUrl.origin}/account`,
    // Stripe-hosted checkout only — no card-on-file dark patterns (Fix #4).
  });
  return NextResponse.redirect(session.url!, 303);
}
