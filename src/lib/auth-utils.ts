// Server-side authentication utilities for API routes
// This file runs in Node.js runtime, not Edge Runtime

import { admin } from '@/lib/firebase-admin';

export async function verifyAuthToken(authHeader: string | null): Promise<{ uid: string; email: string } | null> {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const idToken = authHeader.split('Bearer ')[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || ''
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export function createAuthenticatedHandler<T = any>(
  handler: (req: Request, context: { params: T }, user: { uid: string; email: string }) => Promise<Response>
) {
  return async (req: Request, context: { params: T }): Promise<Response> => {
    const authHeader = req.headers.get('Authorization');
    const user = await verifyAuthToken(authHeader);
    
    if (!user) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return handler(req, context, user);
  };
}