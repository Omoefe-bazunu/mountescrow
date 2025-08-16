import { EmailTemplate } from "@/components/verificationEmailTemplate";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  throw new Error("❌ RESEND_API_KEY is missing from environment variables.");
}

const resend = new Resend(apiKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, firstName, verificationCode } = body;

    if (!email || !firstName || !verificationCode) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: "Mountescrow <tolu@mountescrow.com>",
      to: [email],
      subject: "Verify your Mountescrow account",
      react: EmailTemplate({ firstName, verificationCode }),
    });

    if (error) {
      console.error("❌ Resend API Error:", error);
      return Response.json({ error }, { status: 500 });
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error("❌ Email send error:", error);
    return Response.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    );
  }
}
