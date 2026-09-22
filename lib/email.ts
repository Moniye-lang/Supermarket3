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

/**
 * Strips HTML tags and converts common markup to clean plain text.
 * Multi-part MIME (having both HTML and text) is required by spam filters.
 */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<tr[^>]*>/gi, "")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<td[^>]*>/gi, " ")
    .replace(/<\/td>/gi, "\t")
    .replace(/<h[1-6][^>]*>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "$2 ($1)")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim();
}

// ─── Base Email Sender ───────────────────────────────────────────────────────
export async function sendHtmlEmail(
  to: string,
  subject: string,
  html: string,
  customText?: string,
  options?: { replyTo?: string }
) {
  if (!to || !to.includes("@")) {
    console.warn("[Email] Invalid recipient email:", to);
    return { success: false, error: "Invalid email" };
  }

  const senderEmail = process.env.EMAIL_USER || "davidadeniyi269@gmail.com";
  const plainText = customText || htmlToPlainText(html);
  const replyTo = options?.replyTo || senderEmail;

  // 1. Try Nodemailer Gmail SMTP first (SPF & DKIM authenticated by Google)
  const mail = getTransporter();
  if (mail) {
    const mailOptions = {
      from: `"AMStores" <${senderEmail}>`,
      to,
      replyTo,
      subject,
      text: plainText,
      html,
    };

    try {
      await Promise.race([
        mail.sendMail(mailOptions),
        new Promise((_, reject) => setTimeout(() => reject(new Error("SMTP Timeout (8s)")), 8000)),
      ]);
      console.log(`✅ Email "${subject}" sent to ${to} via authenticated SMTP`);
      return { success: true, method: "smtp" };
    } catch (error: any) {
      console.error(`❌ SMTP failed for ${to}:`, error.message);
    }
  }

  // 2. Fallback to Resend HTTP API if configured
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `AMStores <${senderEmail}>`,
          to,
          reply_to: replyTo,
          subject,
          text: plainText,
          html,
        }),
      });

      const data = (await response.json()) as any;
      if (response.ok) {
        console.log(`✅ Email "${subject}" sent to ${to} via Resend`);
        return { success: true, method: "resend" };
      } else {
        console.warn("⚠️ Resend failed:", data);
      }
    } catch (error: any) {
      console.warn("⚠️ Resend request error:", error.message);
    }
  }

  // 3. Fallback mock if credentials missing
  console.log(`\n📧 [EMAIL MOCK] To: ${to} | Subject: ${subject}`);
  return { success: true, mocked: true };
}

// ─── OTP Verification Email ──────────────────────────────────────────────────
export const sendOtpEmail = async (email: string, otp: string) => {
  const subject = `AMStores: Your Verification Code is ${otp}`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your AMStores Verification Code</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; background-color: #f9fafb; margin: 0; padding: 24px; color: #1f2937;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
    <tr>
      <td style="padding: 24px; text-align: center; border-bottom: 1px solid #f3f4f6;">
        <h2 style="color: #AD343E; margin: 0; font-size: 24px; font-weight: 800;">AMStores</h2>
        <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0;">Supermarket &amp; Gourmet Store · Ibadan</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 28px 24px;">
        <p style="color: #374151; font-size: 15px; margin: 0 0 16px;">Hello,</p>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.5; margin: 0 0 20px;">Use the verification code below to complete your login or account verification:</p>
        
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
          <tr>
            <td align="center" style="background-color: #fef2f2; border: 1.5px dashed #f87171; border-radius: 12px; padding: 18px;">
              <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #AD343E;">${otp}</span>
            </td>
          </tr>
        </table>
        
        <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0;">This code is valid for <strong>10 minutes</strong>. If you did not request this, please disregard this email.</p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f9fafb; padding: 16px 24px; border-top: 1px solid #f3f4f6; text-align: center;">
        <p style="color: #9ca3af; font-size: 11px; margin: 0;">AMStores · General Gas Road, Akobo, Ibadan, Nigeria</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

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
          <strong>${it.name || "Item"}</strong> x ${it.qty}
        </td>
        <td style="padding: 10px 0; text-align: right; color: #111827; font-weight: 600; font-size: 14px;">
          ₦${Number((it.price || 0) * (it.qty || 1)).toLocaleString()}
        </td>
      </tr>`
        )
        .join("")
    : "";

  const subject = `AMStores Order #${orderCode}: Payment Confirmed & In Preparation`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Confirmed - AMStores</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; background-color: #f9fafb; margin: 0; padding: 24px; color: #1f2937;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
    <tr>
      <td style="background-color: #AD343E; padding: 26px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800;">AMStores</h1>
        <p style="margin: 4px 0 0; font-size: 13px; color: #fecaca;">Payment Confirmed · Order In Preparation</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px;">
        <p style="font-size: 15px; color: #1f2937; margin: 0 0 12px;">Hello <strong>${name}</strong>,</p>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin: 0 0 20px;">
          Your payment of <strong>₦${amountStr}</strong> for Order <strong>#${orderCode}</strong> has been received and verified. Our store team is now preparing your items.
        </p>

        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
          <tr>
            <td align="center" style="background-color: #fef2f2; border: 1.5px dashed #f87171; border-radius: 12px; padding: 16px;">
              <span style="display: block; font-size: 11px; font-weight: 700; color: #991b1b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Pickup Code</span>
              <span style="font-family: 'Courier New', Courier, monospace; font-size: 28px; font-weight: 900; letter-spacing: 4px; color: #AD343E;">${pickupCode}</span>
              <span style="display: block; font-size: 12px; color: #6b7280; margin-top: 4px;">Please present this code when receiving your order</span>
            </td>
          </tr>
        </table>

        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 13px; font-weight: 700; color: #374151; text-transform: uppercase; margin: 0 0 10px; letter-spacing: 0.5px;">Order Summary</h3>
          <table width="100%" style="border-collapse: collapse;">
            ${itemsHtml}
            <tr>
              <td style="padding: 14px 0 0; font-size: 15px; font-weight: 700; color: #111827;">Total Paid:</td>
              <td style="padding: 14px 0 0; text-align: right; font-size: 16px; font-weight: 800; color: #AD343E;">₦${amountStr}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #f3f4f6; border-radius: 12px; padding: 14px 16px; margin-bottom: 24px;">
          <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #4b5563; text-transform: uppercase;">Store Location</p>
          <p style="margin: 0; font-size: 13px; font-weight: 600; color: #111827;">AMStores — General Gas Road, Akobo, Ibadan</p>
          <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280;">Direct Contact: 08023434790</p>
        </div>

        <div style="text-align: center;">
          <a href="${clientUrl}/order" style="display: inline-block; background-color: #AD343E; color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 10px;">
            Track Order Live
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f9fafb; padding: 16px 24px; border-top: 1px solid #f3f4f6; text-align: center;">
        <p style="font-size: 11px; color: #9ca3af; margin: 0;">AMStores · General Gas Road, Akobo, Ibadan, Nigeria</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendHtmlEmail(to, subject, html);
}

// ─── 2. Payment Declined Email ───────────────────────────────────────────────
export async function sendPaymentDeclinedEmail(to: string, order: any, customerName?: string) {
  const name = customerName || order.pickupName || "Customer";
  const orderCode = order.pickupCode || order.code || (order._id ? order._id.toString().slice(-6).toUpperCase() : "N/A");
  const amountStr = Number(order.amount || 0).toLocaleString();
  const clientUrl = process.env.NEXTAUTH_URL || process.env.CLIENT_URL || "http://localhost:5000";

  const subject = `AMStores Order #${orderCode}: Payment Verification Update`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Verification Update</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; background-color: #f9fafb; margin: 0; padding: 24px; color: #1f2937;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #fee2e2; border-radius: 16px; overflow: hidden;">
    <tr>
      <td style="background-color: #ef4444; padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800;">AMStores</h1>
        <p style="margin: 4px 0 0; font-size: 13px; color: #fecaca;">Payment Verification Notice</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px;">
        <p style="font-size: 15px; color: #1f2937; margin: 0 0 12px;">Hello <strong>${name}</strong>,</p>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin: 0 0 16px;">
          We were unable to verify your bank transfer payment of <strong>₦${amountStr}</strong> for Order <strong>#${orderCode}</strong>.
        </p>

        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px 16px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 13px; color: #991b1b; font-weight: 600;">Possible reasons:</p>
          <ul style="margin: 6px 0 0 16px; padding: 0; font-size: 12px; color: #7f1d1d; line-height: 1.6;">
            <li>Payment reference was not found or transfer is pending.</li>
            <li>Transferred amount did not match the order total.</li>
            <li>Receipt screenshot was unclear or could not be loaded.</li>
          </ul>
        </div>

        <p style="font-size: 14px; color: #4b5563; line-height: 1.5; margin: 0 0 20px;">
          If you have already sent the transfer, please contact our support team at <strong>08023434790</strong> with your payment confirmation.
        </p>

        <div style="text-align: center; margin-bottom: 14px;">
          <a href="tel:08023434790" style="display: inline-block; background-color: #ef4444; color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 10px; margin-right: 8px;">
            Call Store: 08023434790
          </a>
          <a href="${clientUrl}/order" style="display: inline-block; background-color: #f3f4f6; color: #374151; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 20px; border-radius: 10px; border: 1px solid #d1d5db;">
            View Order Details
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f9fafb; padding: 16px 24px; border-top: 1px solid #f3f4f6; text-align: center;">
        <p style="font-size: 11px; color: #9ca3af; margin: 0;">AMStores Support · General Gas Road, Akobo, Ibadan, Nigeria</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendHtmlEmail(to, subject, html);
}

// ─── 3. Order Ready for Pickup Email ─────────────────────────────────────────
export async function sendOrderReadyEmail(to: string, order: any, customerName?: string) {
  const name = customerName || order.pickupName || "Valued Customer";
  const orderCode = order.pickupCode || order.code || (order._id ? order._id.toString().slice(-6).toUpperCase() : "N/A");
  const pickupCode = orderCode;
  const clientUrl = process.env.NEXTAUTH_URL || process.env.CLIENT_URL || "http://localhost:5000";

  const itemsList = Array.isArray(order.items)
    ? order.items.map((it: any) => `${it.name || "Item"} x ${it.qty}`).join(", ")
    : "Your purchased items";

  const subject = `AMStores Order #${orderCode}: Ready for In-Store Pickup`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Ready for Pickup</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; background-color: #f9fafb; margin: 0; padding: 24px; color: #1f2937;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #d1fae5; border-radius: 16px; overflow: hidden;">
    <tr>
      <td style="background-color: #059669; padding: 26px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Your Order is Ready</h1>
        <p style="margin: 4px 0 0; font-size: 13px; color: #d1fae5;">Packed and ready for pickup at AMStores</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px;">
        <p style="font-size: 15px; color: #1f2937; margin: 0 0 10px;">Hello <strong>${name}</strong>,</p>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin: 0 0 20px;">
          Your order <strong>#${orderCode}</strong> has been carefully packed and is ready for pickup right now.
        </p>

        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 22px;">
          <tr>
            <td align="center" style="background: #ecfdf5; border: 1.5px dashed #059669; border-radius: 14px; padding: 18px;">
              <span style="display: block; font-size: 11px; font-weight: 700; color: #065f46; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">Pickup Code</span>
              <span style="font-family: 'Courier New', Courier, monospace; font-size: 30px; font-weight: 900; letter-spacing: 5px; color: #047857;">${pickupCode}</span>
            </td>
          </tr>
        </table>

        <div style="background-color: #f9fafb; border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; color: #4b5563;">
          <strong style="color: #111827;">Items:</strong> ${itemsList}
        </div>

        <div style="background-color: #f3f4f6; border-radius: 14px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #374151; text-transform: uppercase;">Store Pickup Location</p>
          <p style="margin: 0; font-size: 14px; font-weight: 700; color: #111827;">AMStores</p>
          <p style="margin: 2px 0 0; font-size: 13px; color: #4b5563;">General Gas Road, Akobo, Ibadan, Oyo State</p>
          
          <div style="margin-top: 14px;">
            <a href="tel:08023434790" style="display: block; text-align: center; background-color: #059669; color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 20px; border-radius: 10px;">
              Call Store on Arrival (08023434790)
            </a>
          </div>
        </div>

        <div style="text-align: center;">
          <a href="${clientUrl}/order" style="display: inline-block; color: #059669; font-weight: 700; font-size: 13px; text-decoration: underline;">
            View Order Status
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f9fafb; padding: 16px 24px; border-top: 1px solid #f3f4f6; text-align: center;">
        <p style="font-size: 11px; color: #9ca3af; margin: 0;">AMStores · General Gas Road, Akobo, Ibadan, Nigeria</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendHtmlEmail(to, subject, html);
}

// ─── 4. Contact Form Submission Email ─────────────────────────────────────────
export async function sendContactFormEmail(
  to: string,
  data: { name: string; email: string; subject: string; message: string; createdAt?: Date }
) {
  const { name, email, subject, message } = data;
  const emailSubject = `AMStores Inquiry: ${subject} (from ${name})`;
  const formattedDate = new Date().toLocaleString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Message</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; background-color: #f9fafb; margin: 0; padding: 24px; color: #1f2937;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
    <tr>
      <td style="background-color: #AD343E; padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800;">AMStores</h1>
        <p style="margin: 4px 0 0; font-size: 13px; color: #fecaca;">New Website Contact Message</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px;">
        <p style="font-size: 15px; color: #374151; margin: 0 0 16px;">
          You have received a new inquiry from the website contact form:
        </p>

        <table width="100%" style="border-collapse: collapse; margin-bottom: 20px; background-color: #f9fafb; border-radius: 12px; padding: 14px;">
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 14px; font-weight: 700; color: #4b5563; font-size: 13px; width: 80px;">Name:</td>
            <td style="padding: 10px 14px; color: #111827; font-size: 14px; font-weight: 600;">${name}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 14px; font-weight: 700; color: #4b5563; font-size: 13px;">Email:</td>
            <td style="padding: 10px 14px; color: #111827; font-size: 14px;">
              <a href="mailto:${email}" style="color: #AD343E; font-weight: 600; text-decoration: underline;">${email}</a>
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 14px; font-weight: 700; color: #4b5563; font-size: 13px;">Subject:</td>
            <td style="padding: 10px 14px; color: #111827; font-size: 14px; font-weight: 600;">${subject}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; font-weight: 700; color: #4b5563; font-size: 13px;">Received:</td>
            <td style="padding: 10px 14px; color: #6b7280; font-size: 13px;">${formattedDate}</td>
          </tr>
        </table>

        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 13px; font-weight: 700; color: #4b5563; text-transform: uppercase; margin: 0 0 8px;">Message:</h3>
          <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; font-size: 14px; color: #1f2937; line-height: 1.6; white-space: pre-wrap;">${message}</div>
        </div>

        <div style="text-align: center;">
          <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}" style="display: inline-block; background-color: #AD343E; color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 10px;">
            Reply to ${name}
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f9fafb; padding: 14px 24px; border-top: 1px solid #f3f4f6; text-align: center;">
        <p style="font-size: 11px; color: #9ca3af; margin: 0;">AMStores · Akobo, Ibadan, Nigeria</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendHtmlEmail(to, emailSubject, html, undefined, { replyTo: email });
}
