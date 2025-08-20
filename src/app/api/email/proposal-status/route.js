import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Email templates
const proposalAcceptedTemplate = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #f8f8f8; padding: 10px; text-align: center; }
      .content { padding: 20px; }
      .button { background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Mountescrow</h1>
      </div>
      <div class="content">
        <h2>Proposal Accepted</h2>
        <p>Hello {{recipientName}},</p>
        <p>The proposal "{{projectTitle}}" has been accepted.</p>
        <p><strong>Total Amount:</strong> ₦{{totalAmount}}</p>
        <p><strong>Next Steps:</strong> {{nextSteps}}</p>
        <p>View the deal details:</p>
        <a href="{{dealLink}}" class="button">View Deal</a>
      </div>
    </div>
  </body>
  </html>
`;

const proposalDeclinedTemplate = `
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
        <h2>Proposal Declined</h2>
        <p>Hello {{recipientName}},</p>
        <p>The proposal "{{projectTitle}}" has been declined.</p>
        <p><strong>Reason:</strong> {{reason}}</p>
        <p>Contact support if you have any questions:</p>
        <a href="{{supportLink}}" class="button">Contact Support</a>
      </div>
    </div>
  </body>
  </html>
`;

function fillTemplate(template, replacements) {
  let html = template;
  Object.entries(replacements).forEach(([key, value]) => {
    const safe = value == null ? "" : String(value);
    html = html.replace(new RegExp(`{{${key}}}`, "g"), safe);
  });
  return html;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { emailData } = req.body;

    let html, subject;

    if (emailData.type === "accepted") {
      html = fillTemplate(proposalAcceptedTemplate, {
        recipientName: emailData.recipientName,
        projectTitle: emailData.projectTitle,
        totalAmount: emailData.totalAmount.toFixed(2),
        nextSteps:
          "The deal has been created. Please proceed to fund or start work.",
        dealLink: emailData.dealLink,
      });
      subject = "Proposal Accepted";
    } else if (emailData.type === "declined") {
      html = fillTemplate(proposalDeclinedTemplate, {
        recipientName: emailData.recipientName,
        projectTitle: emailData.projectTitle,
        reason: emailData.reason,
        supportLink: emailData.supportLink,
      });
      subject = "Proposal Declined";
    } else {
      return res.status(400).json({ error: "Invalid email type" });
    }

    const { data, error } = await resend.emails.send({
      from: "Mountescrow <noreply@mountescrow.com>",
      to: [emailData.recipientEmail],
      subject,
      html,
      headers: { "X-Entity-Ref-ID": emailData.proposalId },
      tags: [{ name: "category", value: `proposal_${emailData.type}` }],
    });

    if (error) {
      return res.status(400).json({ error });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
