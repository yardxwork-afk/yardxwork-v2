import { resend } from "./resend";

interface OrderEmailData {
  to: string;
  orderNum: string;
  fileName: string;
  sizePreset: string;
  colorName: string;
  qty: number;
  totalPrice: string;
  discount: number;
}

export async function sendOrderConfirmation(data: OrderEmailData) {
  const discountLine = data.discount > 0
    ? `<tr><td style="padding:4px 0;color:#999">discount</td><td style="padding:4px 0;text-align:right;color:#999">-${(data.discount * 100).toFixed(0)}%</td></tr>`
    : "";

  const { error } = await resend.emails.send({
    from: "Yard Work <onboarding@resend.dev>",
    to: data.to,
    subject: `order confirmed — ${data.orderNum}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#000;color:#fff;font-family:'Courier New',monospace">
  <div style="max-width:480px;margin:0 auto;padding:40px 24px">

    <div style="margin-bottom:32px">
      <strong style="font-size:14px;letter-spacing:.1em">YARD WORK</strong>
    </div>

    <div style="font-size:11px;color:#666;letter-spacing:.1em;margin-bottom:20px">
      order confirmed
    </div>

    <div style="font-size:18px;letter-spacing:.05em;margin-bottom:24px">
      ${data.orderNum}
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:12px;border-top:1px solid #222;border-bottom:1px solid #222;margin-bottom:24px">
      <tr>
        <td style="padding:12px 0;color:#999">file</td>
        <td style="padding:12px 0;text-align:right">${data.fileName}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#999">size</td>
        <td style="padding:4px 0;text-align:right">${data.sizePreset}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#999">color</td>
        <td style="padding:4px 0;text-align:right">${data.colorName}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#999">qty</td>
        <td style="padding:4px 0;text-align:right">${data.qty}</td>
      </tr>
      ${discountLine}
      <tr>
        <td style="padding:12px 0;font-size:14px">total</td>
        <td style="padding:12px 0;text-align:right;font-size:14px">$${data.totalPrice}</td>
      </tr>
    </table>

    <div style="font-size:11px;color:#666;margin-bottom:8px">
      ships 3–5 business days
    </div>

    <div style="font-size:11px;color:#444;margin-top:32px">
      your order is being printed at Yard Work
    </div>

  </div>
</body>
</html>`,
  });

  if (error) {
    console.error("[email] Failed to send confirmation:", error.message);
  } else {
    console.log("[email] ✓ Confirmation sent to", data.to);
  }
}
