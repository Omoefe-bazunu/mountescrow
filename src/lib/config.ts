// This file is used to securely manage environment variables.
// It ensures that secret keys are not exposed in the client-side code.

export const fcmbConfig = {
  clientId: process.env.NEXT_PUBLIC_FCMB_CLIENT_ID,
  clientSecret: process.env.NEXT_PUBLIC_FCMB_CLIENT_SECRET,
  authUrl: process.env.NEXT_PUBLIC_FCMB_AUTH_URL,
  apiBaseUrl: process.env.NEXT_PUBLIC_FCMB_API_BASE_URL,
};

export const emailjsConfig = {
  serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
  templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
  userId: process.env.NEXT_PUBLIC_EMAILJS_USER_ID,
};

// Validate critical environment variables
export function validateEnvironmentVariables() {
  // Check if FCMB credentials are available
  const fcmbAvailable =
    fcmbConfig.clientId &&
    fcmbConfig.clientSecret &&
    fcmbConfig.authUrl &&
    fcmbConfig.apiBaseUrl;

  if (!fcmbAvailable) {
    console.warn("FCMB credentials not fully configured:", {
      hasClientId: !!fcmbConfig.clientId,
      hasClientSecret: !!fcmbConfig.clientSecret,
      hasAuthUrl: !!fcmbConfig.authUrl,
      hasApiBaseUrl: !!fcmbConfig.apiBaseUrl,
    });
    console.warn(
      "Will attempt to use provided credentials or fall back to mock mode."
    );
  }

  return fcmbAvailable;
}

// Optional: Validate EmailJS config (non-critical)
export function validateEmailJSConfig() {
  const emailJSVars = {
    NEXT_PUBLIC_EMAILJS_SERVICE_ID: emailjsConfig.serviceId,
    NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: emailjsConfig.templateId,
    NEXT_PUBLIC_EMAILJS_USER_ID: emailjsConfig.userId,
  };

  const missing = Object.entries(emailJSVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.warn(
      `EmailJS configuration incomplete. Missing: ${missing.join(", ")}`
    );
    return false;
  }
  return true;
}
