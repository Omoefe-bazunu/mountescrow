// Manage environment variables securely
export function validateEnvironmentVariables() {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error("Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  }
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "Missing RESEND_API_KEY. Email functionality will be disabled."
    );
    return false;
  }
  return true;
}
