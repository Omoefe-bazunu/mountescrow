// services/proposal.service.js

// Helper to get CSRF token from cookies
function getCsrfToken() {
  const cookies = document.cookie.split("; ");
  const csrfCookie = cookies.find((c) => c.startsWith("csrf-token="));
  return csrfCookie ? csrfCookie.split("=")[1] : null;
}

// Helper for API calls with credentials (using Next.js API routes)
async function apiCall(endpoint, options = {}) {
  const csrfToken = getCsrfToken();

  const headers = {
    ...options.headers,
  };

  // Add CSRF token for non-GET requests
  if (options.method && options.method !== "GET" && csrfToken) {
    headers["x-csrf-token"] = csrfToken;
  }

  // Only add Content-Type if not FormData (browser sets it automatically for FormData)
  if (!(options.body instanceof FormData) && options.body) {
    headers["Content-Type"] = "application/json";
  }

  // Use relative paths - Next.js API routes will proxy to backend
  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: "include", // Important for cookies
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Create a new proposal
 */
export async function createProposal(data) {
  const {
    projectTitle,
    description,
    counterpartyEmail,
    creatorRole,
    milestones,
    totalAmount,
    escrowFee,
    escrowFeePayer,
    files,
  } = data;

  // Create FormData for file upload
  const formData = new FormData();
  formData.append("projectTitle", projectTitle);
  formData.append("description", description);
  formData.append("counterpartyEmail", counterpartyEmail);
  formData.append("creatorRole", creatorRole);
  formData.append("milestones", JSON.stringify(milestones));
  formData.append("totalAmount", totalAmount.toString());
  formData.append("escrowFee", escrowFee.toString());
  formData.append("escrowFeePayer", escrowFeePayer.toString());

  // Append files
  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append("files", file);
    });
  }

  const result = await apiCall("/api/proposals", {
    method: "POST",
    body: formData,
  });

  return {
    proposalId: result.proposalId,
    emailData: {
      type: creatorRole === "buyer" ? "invitation" : "created",
    },
  };
}

/**
 * Get all proposals for the current user
 */
export async function getProposals() {
  const result = await apiCall("/api/proposals", {
    method: "GET",
  });

  return result.proposals || [];
}

/**
 * Get a single proposal by ID
 */
export async function getProposalById(id) {
  try {
    const result = await apiCall(`/api/proposals/${id}`, {
      method: "GET",
    });

    return result.proposal;
  } catch (error) {
    console.error("Error fetching proposal:", error);
    return null;
  }
}

/**
 * Update proposal status
 */
export async function updateProposalStatus(
  proposalId,
  status,
  reason = "No reason provided"
) {
  const result = await apiCall(`/api/proposals/${proposalId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, reason }),
  });

  return {
    emailData: {
      type: status.toLowerCase(),
    },
  };
}

/*
 Accept and fund a seller-initiated proposal
 */

export async function acceptAndFundSellerInitiatedProposal(
  proposalId,
  buyerId
) {
  const result = await apiCall(`/api/proposals/${proposalId}/accept-and-fund`, {
    method: "POST",
    body: JSON.stringify({ buyerId }),
  });

  // Return the full result including dealId, deductedAmount, newBalance
  return result;
}
