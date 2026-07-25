import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

/** Mirrors subscription state into the subscriptions table (service role). */
export async function POST(req: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY, whsec = process.env.STRIPE_WEBHOOK_SECRET;
  const supaUrl = process.env.SUPABASE_URL, service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !whsec || !supaUrl || !service) return NextResponse.json({ ok: false }, { status: 503 });

  const stripe = new Stripe(key);
  const sig = req.headers.get("stripe-signature")!;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), sig, whsec);
  } catch {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  if (event.type.startsWith("customer.subscription.")) {
    const sub = event.data.object as Stripe.Subscription;
    const supabase = createClient(supaUrl, service);
    await supabase.from("subscriptions").upsert({
      external_id: sub.id,
      platform: "stripe",
      profile_id: sub.metadata.profile_id,
      status: sub.status === "active" ? "active" : sub.status === "past_due" ? "grace" : "expired",
      renews_at: new Date(((sub as unknown as { current_period_end: number }).current_period_end) * 1000).toISOString(),
    }, { onConflict: "external_id" });
  }
  return NextResponse.json({ received: true });
}
