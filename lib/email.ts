import nodemailer from "nodemailer";

let transporter: any = null;

const getTransporter = () => {
  if (!transporter) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("⚠️ Email credentials missing in .env.local. Emails will be logged to console.");
      return null;
    }
    const cleanPass = process.env.EMAIL_PASS.replace(/\s+/g, "");
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: cleanPass,
      },
    });
  }
  return transporter;
};

// ─── Base HTML Email Sender ──────────────────────────────────────────────────
export async function sendHtmlEmail(to: string, subject: string, html: string) {
  if (!to || !to.includes("@")) {
    console.warn("[Email] Invalid recipient email:", to);
    return { success: false, error: "Invalid email" };
  }

  // 1. Try Resend HTTP API (if configured)
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "AMStores <orders@resend.dev>",
          to,
          subject,
          html,
        }),
      });

      const data = (await response.json()) as any;
      if (response.ok) {
        console.log(`✅ Email "${subject}" sent to ${to} via Resend API`);
        return { success: true, method: "resend" };
      } else {
        console.warn("⚠️ Resend API failed, falling back to SMTP:", data);
      }
    } catch (error: any) {
      console.warn("⚠️ Resend request error:", error.message);
    }
  }

  // 2. Try Nodemailer Gmail SMTP
  const mail = getTransporter();
  if (!mail) {
    console.log(`\n📧 [EMAIL MOCK] To: ${to} | Subject: ${subject}`);
    return { success: true, mocked: true };
  }

  const mailOptions = {
    from: `"AMStores" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    await Promise.race([
      mail.sendMail(mailOptions),
      new Promise((_, reject) => setTimeout(() => reject(new Error("SMTP Timeout (8s)")), 8000)),
    ]);
    console.log(`✅ Email "${subject}" sent to ${to} via SMTP`);
    return { success: true, method: "smtp" };
  } catch (error: any) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

// ─── OTP Verification Email ──────────────────────────────────────────────────
export const sendOtpEmail = async (email: string, otp: string) => {
  const subject = "Your AMStores Verification Code";
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #fee2e2; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #dc2626; margin: 0; font-size: 24px;">AMStores</h2>
        <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0;">Supermarket &amp; Gourmet Store</p>
      </div>
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
        <p style="color: #991b1b; font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 0 0 8px;">Your Verification Code</p>
        <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #dc2626;">${otp}</span>
      </div>
      <p style="color: #4b5563; font-size: 14px; line-height: 1.5; margin: 0 0 12px;">This code will expire in <strong>10 minutes</strong>. If you did not request this code, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 20px 0;" />
      <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 0;">AMStores · General Gas Road, Akobo, Ibadan, Nigeria</p>
    </div>
  `;

  return sendHtmlEmail(email, subject, html);
};

// ─── 1. Payment Received & Order Accepted Email ──────────────────────────────
export async function sendOrderAcceptedEmail(to: string, order: any, customerName?: string) {
  const name = customerName || order.pickupName || "Valued Customer";
  const orderCode = order.pickupCode || order.code || (order._id ? order._id.toString().slice(-6).toUpperCase() : "N/A");
  const amountStr = Number(order.amount || 0).toLocaleString();
  const pickupCode = orderCode;
  const clientUrl = process.env.NEXTAUTH_URL || process.env.CLIENT_URL || "http://localhost:5000";

  const itemsHtml = Array.isArray(order.items)
    ? order.items
        .map(
          (it: any) => `
      <tr style="border-bottom: 1px solid #f3f4f6;">
        <td style="padding: 10px 0; color: #374151; font-size: 14px;">
          <strong>${it.name || "Item"}</strong> × ${it.qty}
        </td>
        <td style="padding: 10px 0; text-align: right; color: #111827; font-weight: 600; font-size: 14px;">
          ₦${Number((it.price || 0) * (it.qty || 1)).toLocaleString()}
        </td>
      </tr>`
        )
        .join("")
    : "";

  const subject = `✅ Payment Received & Order Accepted! — AMStores #${orderCode}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px 20px; background-color: #f9fafb;">
      <div style="background-color: #ffffff; border-radius: 20px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
        
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">AMStores</h1>
          <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.95;">Payment Confirmed · Order Accepted</p>
        </div>

        <div style="padding: 24px;">
          <p style="font-size: 16px; color: #1f2937; margin: 0 0 12px;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin: 0 0 20px;">
            Your payment of <strong style="color: #111827;">₦${amountStr}</strong> for Order <strong style="color: #dc2626;">#${orderCode}</strong> has been successfully received and verified! Our store staff is now packing your items.
          </p>

          <!-- Pickup Code Badge -->
          <div style="background-color: #fef2f2; border: 2px dashed #f87171; border-radius: 14px; padding: 16px; text-align: center; margin-bottom: 24px;">
            <span style="display: block; font-size: 11px; font-weight: 700; color: #991b1b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Your Pickup Code</span>
            <span style="font-family: monospace; font-size: 28px; font-weight: 900; letter-spacing: 4px; color: #dc2626;">${pickupCode}</span>
            <span style="display: block; font-size: 12px; color: #6b7280; margin-top: 4px;">Show this code when collecting your order</span>
          </div>

          <!-- Order Summary Table -->
          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 14px; font-weight: 700; color: #374151; text-transform: uppercase; margin: 0 0 10px; letter-spacing: 0.5px;">Order Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${itemsHtml}
              <tr>
                <td style="padding: 14px 0 0; font-size: 15px; font-weight: 700; color: #111827;">Total Paid:</td>
                <td style="padding: 14px 0 0; text-align: right; font-size: 18px; font-weight: 800; color: #dc2626;">₦${amountStr}</td>
              </tr>
            </table>
          </div>

          <!-- Pickup Station Info -->
          <div style="background-color: #f3f4f6; border-radius: 12px; padding: 14px 16px; margin-bottom: 24px;">
            <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #4b5563; text-transform: uppercase;">🏪 Pickup Location</p>
            <p style="margin: 0; font-size: 13px; font-weight: 600; color: #111827;">AMStores — General Gas Road, Akobo, Ibadan</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280;">Contact Store: 08023434790</p>
          </div>

          <!-- Call / Action Button -->
          <div style="text-align: center; margin-bottom: 10px;">
            <a href="${clientUrl}/order" style="display: inline-block; background-color: #dc2626; color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 12px; box-shadow: 0 2px 8px rgba(220,38,38,0.25);">
              Track Order Live
            </a>
          </div>
        </div>

        <div style="background-color: #f9fafb; padding: 16px 24px; border-top: 1px solid #f3f4f6; text-align: center;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0;">Thank you for shopping with AMStores Ibadan.</p>
        </div>
      </div>
    </div>
  `;

  return sendHtmlEmail(to, subject, html);
}

// ─── 2. Payment Declined Email ───────────────────────────────────────────────
export async function sendPaymentDeclinedEmail(to: string, order: any, customerName?: string) {
  const name = customerName || order.pickupName || "Customer";
  const orderCode = order.pickupCode || order.code || (order._id ? order._id.toString().slice(-6).toUpperCase() : "N/A");
  const amountStr = Number(order.amount || 0).toLocaleString();
  const clientUrl = process.env.NEXTAUTH_URL || process.env.CLIENT_URL || "http://localhost:5000";

  const subject = `❌ Payment Verification Declined — AMStores #${orderCode}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px 20px; background-color: #f9fafb;">
      <div style="background-color: #ffffff; border-radius: 20px; border: 1px solid #fee2e2; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
        
        <div style="background-color: #ef4444; padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800;">AMStores</h1>
          <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Payment Verification Issue</p>
        </div>

        <div style="padding: 24px;">
          <p style="font-size: 16px; color: #1f2937; margin: 0 0 12px;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin: 0 0 16px;">
            We could not verify your bank transfer payment of <strong>₦${amountStr}</strong> for Order <strong style="color: #ef4444;">#${orderCode}</strong>.
          </p>

          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 13px; color: #991b1b; font-weight: 600;">Possible reasons:</p>
            <ul style="margin: 6px 0 0 16px; padding: 0; font-size: 12px; color: #7f1d1d; line-height: 1.6;">
              <li>The payment transfer reference was not found or payment did not clear.</li>
              <li>The transferred amount did not match the order total.</li>
              <li>Receipt screenshot was unclear or invalid.</li>
            </ul>
          </div>

          <p style="font-size: 14px; color: #4b5563; line-height: 1.5; margin: 0 0 20px;">
            If you have already made the transfer, please contact our support team immediately or call us at <strong>08023434790</strong> with your transfer receipt.
          </p>

          <!-- 1-Click Call & Re-try Buttons -->
          <div style="text-align: center; margin-bottom: 14px;">
            <a href="tel:08023434790" style="display: inline-block; background-color: #ef4444; color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 12px; margin-right: 8px;">
              📞 Call Store: 08023434790
            </a>
            <a href="${clientUrl}/order" style="display: inline-block; background-color: #f3f4f6; color: #374151; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 20px; border-radius: 12px; border: 1px solid #d1d5db;">
              View Order
            </a>
          </div>
        </div>

        <div style="background-color: #f9fafb; padding: 16px 24px; border-top: 1px solid #f3f4f6; text-align: center;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0;">AMStores Support · General Gas Road, Akobo, Ibadan</p>
        </div>
      </div>
    </div>
  `;

  return sendHtmlEmail(to, subject, html);
}

// ─── 3. Order Ready for Pickup Email ─────────────────────────────────────────
export async function sendOrderReadyEmail(to: string, order: any, customerName?: string) {
  const name = customerName || order.pickupName || "Valued Customer";
  const orderCode = order.pickupCode || order.code || (order._id ? order._id.toString().slice(-6).toUpperCase() : "N/A");
  const pickupCode = orderCode;
  const clientUrl = process.env.NEXTAUTH_URL || process.env.CLIENT_URL || "http://localhost:5000";

  const itemsList = Array.isArray(order.items)
    ? order.items.map((it: any) => `${it.name || "Item"} × ${it.qty}`).join(", ")
    : "Your purchased items";

  const subject = `🛍️ Your Order is Ready for Pickup! — AMStores #${orderCode}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px 20px; background-color: #f9fafb;">
      <div style="background-color: #ffffff; border-radius: 20px; border: 1px solid #d1fae5; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
        
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
          <div style="font-size: 36px; margin-bottom: 4px;">🛍️</div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Your Order is Ready!</h1>
          <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.95;">All packed and waiting for you at AMStores</p>
        </div>

        <div style="padding: 24px;">
          <p style="font-size: 16px; color: #1f2937; margin: 0 0 10px;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin: 0 0 20px;">
            Great news! Your order <strong style="color: #059669;">#${orderCode}</strong> has been carefully packed and is ready for pickup right now.
          </p>

          <!-- Highlighted Pickup Code -->
          <div style="background: #ecfdf5; border: 2px dashed #059669; border-radius: 16px; padding: 18px; text-align: center; margin-bottom: 22px;">
            <span style="display: block; font-size: 11px; font-weight: 700; color: #065f46; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">Present This Code at Counter</span>
            <span style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 5px; color: #047857;">${pickupCode}</span>
          </div>

          <!-- Items Info -->
          <div style="background-color: #f9fafb; border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; color: #4b5563;">
            <strong style="color: #111827;">Items packed:</strong> ${itemsList}
          </div>

          <!-- Pickup Location & One-Click Call -->
          <div style="background-color: #f3f4f6; border-radius: 14px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #374151; text-transform: uppercase;">🏪 Store Pickup Location</p>
            <p style="margin: 0; font-size: 14px; font-weight: 700; color: #111827;">AMStores</p>
            <p style="margin: 2px 0 0; font-size: 13px; color: #4b5563;">General Gas Road, Akobo, Ibadan, Oyo State</p>
            
            <!-- One-Click Call on Arrival -->
            <div style="margin-top: 14px;">
              <a href="tel:08023434790" style="display: block; text-align: center; background-color: #059669; color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(5,150,105,0.3);">
                📞 Call Store on Arrival (08023434790)
              </a>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${clientUrl}/order" style="display: inline-block; color: #059669; font-weight: 700; font-size: 13px; text-decoration: underline;">
              View Live Order Status →
            </a>
          </div>
        </div>

        <div style="background-color: #f9fafb; padding: 16px 24px; border-top: 1px solid #f3f4f6; text-align: center;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0;">AMStores · General Gas Road, Akobo, Ibadan</p>
        </div>
      </div>
    </div>
  `;

  return sendHtmlEmail(to, subject, html);
}
