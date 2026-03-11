import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
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
      await saveOrder(session);
      break;
    }
    case "checkout.session.expired": {
      console.log("[webhook] Session expired:", session_id(event));
      break;
    }
    default:
      console.log("[webhook] Unhandled event:", event.type);
  }
}

function session_id(event: Stripe.Event): string {
  return (event.data.object as Stripe.Checkout.Session).id;
}

async function saveOrder(session: Stripe.Checkout.Session) {
  const meta = session.metadata || {};
  const orderNum = "YW-" + session.id.slice(-6).toUpperCase();

  const { error } = await supabaseAdmin.from("orders").insert({
    order_number: orderNum,
    stripe_session: session.id,
    status: "paid",
    file_name: meta.fileName || "unknown",
    vol_cm3: Number(meta.volCm3) || null,
    scale_factor: Number(meta.scaleFactor) || null,
    max_dim_mm: Number(meta.maxDimMm) || null,
    size_preset: meta.sizePreset || null,
    scale: Number(meta.scale) || null,
    color_id: meta.colorId || null,
    color_name: meta.colorName || null,
    qty: Number(meta.qty) || 1,
    unit_price: Number(meta.unitPrice) || null,
    total_price: Number(meta.totalPrice) || 0,
    discount: Number(meta.discount) || 0,
    grams: Number(meta.grams) || null,
    shipping_name: meta.shippingName || "",
    shipping_email: session.customer_details?.email || "",
    shipping_addr: meta.shippingAddress || null,
    shipping_city: meta.shippingCity || null,
    shipping_state: meta.shippingState || null,
    shipping_zip: meta.shippingZip || null,
  });

  if (error) {
    console.error("[webhook] Failed to save order:", error.message);
    // Don't throw — Stripe would retry and create duplicates
  } else {
    console.log("[webhook] ✓ Order saved:", orderNum, "— $" + meta.totalPrice);
  }
}
