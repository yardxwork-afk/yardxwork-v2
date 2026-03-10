import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  // If no webhook secret configured, log the raw event (dev mode)
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn("[webhook] STRIPE_WEBHOOK_SECRET not set — skipping signature verification");
    try {
      const event = JSON.parse(body) as Stripe.Event;
      await handleEvent(event);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    return NextResponse.json({ received: true });
  }

  // Verify signature in production
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[webhook] Signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await handleEvent(event);
  return NextResponse.json({ received: true });
}

async function handleEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata || {};
      console.log("[webhook] ✓ Payment successful");
      console.log("[webhook]   Session:", session.id);
      console.log("[webhook]   Amount:", session.amount_total, "cents");
      console.log("[webhook]   Email:", session.customer_details?.email);
      console.log("[webhook]   File:", meta.fileName);
      console.log("[webhook]   Config:", meta.sizePreset, "/", meta.colorName, "/ qty", meta.qty);
      console.log("[webhook]   Price: $" + meta.totalPrice);
      // Future: write to Supabase, send Resend email, trigger R2 upload
      break;
    }
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("[webhook] ✗ Session expired:", session.id);
      break;
    }
    default:
      console.log("[webhook] Unhandled event:", event.type);
  }
}
