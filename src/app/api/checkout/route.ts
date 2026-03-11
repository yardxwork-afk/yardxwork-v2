import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { calcPrice } from "@/lib/pricing";

interface CheckoutBody {
  fileName: string;
  fileKey: string;
  volCm3: number;
  scaleFactor: number;
  maxDimMm: number;
  sizePreset: string;
  scale: number;
  colorId: string;
  colorName: string;
  qty: number;
  shipping: {
    name: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: CheckoutBody = await req.json();

    // Validate required fields
    if (!body.fileName || !body.volCm3 || !body.colorId || !body.qty) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!body.shipping?.name || !body.shipping?.email?.includes("@")) {
      return NextResponse.json({ error: "Invalid shipping info" }, { status: 400 });
    }

    // Recalculate price server-side (never trust the client)
    const pricing = calcPrice(body.volCm3, body.scaleFactor, body.scale, body.qty);
    const totalCents = Math.round(pricing.total * 100);

    // Build description line
    const desc = [
      body.sizePreset || "custom",
      body.colorName,
      `qty ${body.qty}`,
      pricing.disc > 0 ? `-${(pricing.disc * 100).toFixed(0)}% batch discount` : "",
    ].filter(Boolean).join(" / ");

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: body.shipping.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: totalCents,
            product_data: {
              name: `3D Print: ${body.fileName.slice(0, 200)}`,
              description: desc,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        fileName: body.fileName.slice(0, 450),
        fileKey: body.fileKey || "",
        volCm3: String(body.volCm3),
        scaleFactor: String(body.scaleFactor),
        maxDimMm: String(body.maxDimMm),
        sizePreset: body.sizePreset,
        scale: String(body.scale),
        colorId: body.colorId,
        colorName: body.colorName,
        qty: String(body.qty),
        unitPrice: pricing.unit.toFixed(2),
        totalPrice: pricing.total.toFixed(2),
        discount: String(pricing.disc),
        grams: pricing.grams.toFixed(1),
        shippingName: body.shipping.name,
        shippingAddress: body.shipping.address,
        shippingCity: body.shipping.city,
        shippingState: body.shipping.state,
        shippingZip: body.shipping.zip,
      },
      success_url: `${req.nextUrl.origin}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("Checkout session error:", err);
    const message = err instanceof Error ? err.message : "Failed to create checkout session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
