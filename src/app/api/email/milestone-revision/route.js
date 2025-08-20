import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const milestoneRevisionTemplate = `
  <!DOCTYPE html>
  <html>
  <body>
    <h2>Milestone Revision Requested</h2>
    <p>Hello {{recipientEmail}},</p>
    <p>The buyer has requested a revision for the milestone "{{milestoneTitle}}" in the deal "{{projectTitle}}".</p>
    <p><strong>Reason:</strong> {{message}}</p>
    <p>Please review and resubmit the work.</p>
    <a href="{{dealLink}}">View Deal</a>
  </body>
  </html>
`;

export async function POST(req) {
  try {
    const { recipientEmail, projectTitle, milestoneTitle, message, dealId } =
      await req.json();
    if (
      !recipientEmail ||
      !projectTitle ||
      !milestoneTitle ||
      !message ||
      !dealId
    ) {
      throw new Error("Missing required fields");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      throw new Error("Invalid recipient email");
    }

    const dealLink = `https://www.mountescrow.com/deals/${dealId}`;
    const html = milestoneRevisionTemplate
      .replace("{{recipientEmail}}", recipientEmail)
      .replace("{{projectTitle}}", projectTitle)
      .replace("{{milestoneTitle}}", milestoneTitle)
      .replace("{{message}}", message)
      .replace("{{dealLink}}", dealLink);

    const { data, error } = await resend.emails.send({
      from: "Mountescrow <noreply@mountescrow.com>",
      to: [recipientEmail],
      subject: "Milestone Revision Requested",
      html,
    });

    if (error) {
      throw new Error(`Resend API error: ${error.message}`);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("Error sending milestone-revision email:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
