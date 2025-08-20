// Service for sending emails via Resend
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Send email using Resend templates
export async function sendEmail({ to, subject, template, template_data }) {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");

  try {
    await resend.emails.send({
      from: "Mountescrow <noreply@mountescrow.com>",
      to,
      subject,
      react: template,
      reactData: template_data,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
}
