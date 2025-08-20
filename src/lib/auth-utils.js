// Client-side authentication utilities for API routes
import { getAuth } from "firebase/auth";
import { app } from "./firebase";

// Verify auth token client-side
export async function verifyAuthToken(authHeader) {
  if (!authHeader?.startsWith("Bearer ")) return null;

  const idToken = authHeader.split("Bearer ")[1];
  try {
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) return null;
    const token = await user.getIdToken();
    if (token !== idToken) return null;
    return { uid: user.uid, email: user.email || "" };
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

// Create authenticated handler for API routes
export function createAuthenticatedHandler(handler) {
  return async (req, context) => {
    const authHeader = req.headers.get("Authorization");
    const user = await verifyAuthToken(authHeader);

    if (!user) {
      return new Response(
        JSON.stringify({ message: "Unauthorized: Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    return handler(req, context, user);
  };
}
