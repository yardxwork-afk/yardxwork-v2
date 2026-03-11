import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { sendOrderConfirmation } from "@/lib/email";
import { redirect } from "next/navigation";
import SuccessContent from "./SuccessContent";

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function OrderSuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const sessionId = params.session_id;

  if (!sessionId) {
    redirect("/");
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    redirect("/");
  }

  if (session.payment_status !== "paid") {
    redirect("/");
  }

  const meta = session.metadata || {};
  const orderNum = "YW-" + sessionId.slice(-6).toUpperCase();

  // Check if order already exists (page refresh vs first visit)
  const { data: existing } = await supabaseAdmin
    .from("orders")
    .select("id")
    .eq("stripe_session", sessionId)
    .maybeSingle();

  const isNewOrder = !existing;

  // Upsert order — idempotent so page refreshes don't create duplicates
  await supabaseAdmin.from("orders").upsert(
    {
      order_number: orderNum,
      stripe_session: sessionId,
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
      file_url: meta.fileKey || null,
    },
    { onConflict: "stripe_session" }
  );

  // Send confirmation email only on first visit (not page refreshes)
  const customerEmail = session.customer_details?.email || "";
  if (isNewOrder && customerEmail) {
    await sendOrderConfirmation({
      to: customerEmail,
      orderNum,
      fileName: meta.fileName || "unknown",
      sizePreset: meta.sizePreset || "custom",
      colorName: meta.colorName || "unknown",
      qty: Number(meta.qty) || 1,
      totalPrice: meta.totalPrice || "0.00",
      discount: Number(meta.discount) || 0,
    });
  }

  return (
    <SuccessContent
      orderNum={orderNum}
      fileName={meta.fileName || "unknown"}
      sizePreset={meta.sizePreset || "custom"}
      colorName={meta.colorName || "unknown"}
      qty={Number(meta.qty) || 1}
      totalPrice={meta.totalPrice || "0.00"}
      discount={Number(meta.discount) || 0}
      customerEmail={session.customer_details?.email || ""}
    />
  );
}
