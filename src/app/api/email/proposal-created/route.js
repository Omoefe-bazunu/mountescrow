import { createProposal } from "@/services/proposal.service";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Email template
const proposalCreatedTemplate = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #f8f8f8; padding: 10px; text-align: center; }
      .content { padding: 20px; }
      .button { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Mountescrow</h1>
      </div>
      <div class="content">
        <h2>New Proposal Created</h2>
        <p>Hello {{recipientName}},</p>
        <p>A new proposal "{{projectTitle}}" has been created for you.</p>
        <p><strong>Total Amount:</strong> ₦{{totalAmount}}</p>
        <p><strong>Description:</strong> {{description}}</p>
        <p><strong>Created by:</strong> {{creatorEmail}}</p>
        <p>View the proposal details and take action:</p>
        <a href="{{proposalLink}}" class="button">View Proposal</a>
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

    const html = fillTemplate(proposalCreatedTemplate, {
      recipientName: emailData.recipientName,
      projectTitle: emailData.projectTitle,
      totalAmount: emailData.totalAmount.toFixed(2),
      description: emailData.description,
      creatorEmail: emailData.creatorEmail,
      proposalLink: emailData.proposalLink,
    });

    const { data, error } = await resend.emails.send({
      from: "Mountescrow <noreply@mountescrow.com>",
      to: [emailData.recipientEmail],
      subject: "New Proposal Created",
      html,
      headers: { "X-Entity-Ref-ID": emailData.proposalId },
      tags: [{ name: "category", value: "proposal_created" }],
    });

    if (error) {
      return res.status(400).json({ error });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
