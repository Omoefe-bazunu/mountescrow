import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const disputeCreatedTemplate = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #f8f8f8; padding: 10px; text-align: center; }
      .content { padding: 20px; }
      .button { background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Mountescrow</h1>
      </div>
      <div class="content">
        <h2>Dispute Filed</h2>
        <p>Hello {{recipientName}},</p>
        <p>A dispute has been filed for the deal "{{projectTitle}}".</p>
        <p><strong>Reason:</strong> {{reason}}</p>
        <p><strong>Deal ID:</strong> {{dealId}}</p>
        <p>Please review the dispute details and respond:</p>
        <a href="{{disputeLink}}" class="button">View Dispute</a>
      </div>
    </div>
  </body>
  </html>
`;

export async function POST(req) {
  try {
    const {
      recipientEmail,
      recipientName,
      projectTitle,
      reason,
      dealId,
      disputeId,
    } = await req.json();
    if (
      !recipientEmail ||
      !recipientName ||
      !projectTitle ||
      !reason ||
      !dealId ||
      !disputeId
    ) {
      throw new Error("Missing required fields");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      throw new Error("Invalid recipient email");
    }

    const disputeLink = `https://www.mountescrow.com/disputes/${disputeId}`;
    const html = disputeCreatedTemplate
      .replace("{{recipientName}}", recipientName)
      .replace("{{projectTitle}}", projectTitle)
      .replace("{{reason}}", reason)
      .replace("{{dealId}}", dealId)
      .replace("{{disputeLink}}", disputeLink);

    const { error } = await resend.emails.send({
      from: "Mountescrow <info@mountescrow.com>",
      to: [recipientEmail],
      subject: "New Dispute Filed",
      html,
      headers: { "X-Entity-Ref-ID": disputeId },
      tags: [{ name: "category", value: "dispute_created" }],
    });

    if (error) {
      throw new Error(`Resend API error: ${error.message}`);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("Error sending dispute-created email:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
