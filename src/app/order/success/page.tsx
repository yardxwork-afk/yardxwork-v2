import { stripe } from "@/lib/stripe";
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

  return (
    <SuccessContent
      fileName={meta.fileName || "unknown"}
      sizePreset={meta.sizePreset || "custom"}
      colorName={meta.colorName || "unknown"}
      qty={Number(meta.qty) || 1}
      totalPrice={meta.totalPrice || "0.00"}
      discount={Number(meta.discount) || 0}
      customerEmail={session.customer_details?.email || ""}
      sessionId={sessionId}
    />
  );
}
