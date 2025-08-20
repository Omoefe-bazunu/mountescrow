import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const dealCreatedTemplate = `
  <!DOCTYPE html>
  <html>
  <body>
    <h2>New Deal Created</h2>
    <p>Hello {{recipientEmail}},</p>
    <p>A new deal for "{{projectTitle}}" has been created.</p>
    <p><strong>Total Amount:</strong> ₦{{totalAmount}}</p>
    <p><strong>Status:</strong> {{status}}</p>
    <a href="{{dealLink}}">View Deal</a>
  </body>
  </html>
`;

export async function POST(req) {
  try {
    const { recipientEmail, projectTitle, totalAmount, status, dealId } =
      await req.json();
    if (
      !recipientEmail ||
      !projectTitle ||
      !totalAmount ||
      !status ||
      !dealId
    ) {
      throw new Error("Missing required fields");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      throw new Error("Invalid recipient email");
    }

    const dealLink = `https://www.mountescrow.com/deals/${dealId}`;
    const html = dealCreatedTemplate
      .replace("{{recipientEmail}}", recipientEmail)
      .replace("{{projectTitle}}", projectTitle)
      .replace("{{totalAmount}}", Number(totalAmount).toFixed(2))
      .replace("{{status}}", status)
      .replace("{{dealLink}}", dealLink);

    await resend.emails.send({
      from: "Mountescrow <noreply@mountescrow.com>",
      to: [recipientEmail],
      subject: "New Deal Created",
      html,
    });

    return new Response(JSON.stringify({ success: true, dealId }), {
      status: 200,
    });
  } catch (err) {
    console.error("Error sending deal-created email:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
