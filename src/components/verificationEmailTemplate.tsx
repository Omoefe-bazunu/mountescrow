interface EmailTemplateProps {
  firstName: string;
  verificationCode: string;
}

export function EmailTemplate({
  firstName,
  verificationCode,
}: EmailTemplateProps) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <h2>Hello {firstName},</h2>
      <p>
        Thank you for signing up on <strong>Mountescrow</strong>.
      </p>
      <p>Use the verification code below to complete your registration:</p>
      <h3
        style={{
          backgroundColor: "#f0f0f0",
          padding: "10px",
          width: "fit-content",
        }}
      >
        {verificationCode}
      </h3>
      <p>If you didn’t create this account, you can ignore this message.</p>
      <p>— Mountescrow Team</p>
    </div>
  );
}
