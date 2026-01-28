// src/services/dataDeletion.service.js

// Helper to get CSRF token from cookies
function getCsrfToken() {
  // Check if we're in browser environment
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split("; ");
  const csrfCookie = cookies.find((c) => c.startsWith("csrf-token="));
  return csrfCookie ? csrfCookie.split("=")[1] : null;
}

// Helper for API calls with credentials
async function apiCall(endpoint, options = {}) {
  const csrfToken = getCsrfToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Add CSRF token for non-GET requests
  if (options.method && options.method !== "GET" && csrfToken) {
    headers["x-csrf-token"] = csrfToken;
  }

  // Use relative URLs (will go through Next.js proxy routes)
  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: "include", // Important for cookies
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: "Request failed" };
    }
    throw new Error(
      errorData.message || errorData.error || `HTTP ${response.status}`,
    );
  }

  return response.json();
}

/**
 * Submit a data deletion request
 */
export async function submitDeletionRequest(reason) {
  try {
    const data = await apiCall("/api/data-deletion/request", {
      method: "POST",
      body: JSON.stringify({ reason }),
    });

    return data;
  } catch (error) {
    console.error("Submit deletion request error:", error);
    throw error;
  }
}

/**
 * Get all data deletion requests (Admin only)
 */
export async function getAllDeletionRequests(status = null) {
  try {
    let endpoint = "/api/data-deletion/requests";
    if (status) {
      endpoint += `?status=${status}`;
    }

    const data = await apiCall(endpoint, {
      method: "GET",
    });

    return data.requests || [];
  } catch (error) {
    console.error("Get deletion requests error:", error);
    throw error;
  }
}

/**
 * Update deletion request status (Admin only)
 */
export async function updateDeletionRequestStatus(
  requestId,
  status,
  adminNotes = null,
) {
  try {
    const data = await apiCall(`/api/data-deletion/requests/${requestId}`, {
      method: "PATCH",
      body: JSON.stringify({ status, adminNotes }),
    });

    return data;
  } catch (error) {
    console.error("Update deletion request error:", error);
    throw error;
  }
}
