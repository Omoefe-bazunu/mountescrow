// services/deal.service.js - REPLACE ENTIRE FILE

// Helper for API calls
async function apiCall(endpoint, options = {}) {
  const headers = {
    ...options.headers,
  };

  // Only add Content-Type if not FormData
  if (!(options.body instanceof FormData) && options.body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: "include",
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
 * Get all deals for current user
 */
export async function getDeals() {
  const result = await apiCall("/api/deals", {
    method: "GET",
  });
  return result.deals || [];
}

/**
 * Get single deal by ID
 */
export async function getDealById(dealId) {
  try {
    const result = await apiCall(`/api/deals/${dealId}`, {
      method: "GET",
    });
    return result.deal;
  } catch (error) {
    console.error("Error fetching deal:", error);
    return null;
  }
}

/**
 * Create deal from proposal (seller accepts)
 */
export async function createDealFromProposal(proposalId) {
  const result = await apiCall("/api/deals/create-from-proposal", {
    method: "POST",
    body: JSON.stringify({ proposalId }),
  });
  return result.dealId;
}

/**
 * Fund deal (buyer funds the deal)
 */
export async function fundDeal(dealId) {
  const result = await apiCall(`/api/deals/${dealId}/fund`, {
    method: "POST",
  });
  return result;
}

/**
 * Submit milestone work (seller submits work)
 */
export async function submitMilestoneWork(
  dealId,
  milestoneIndex,
  message,
  files
) {
  const formData = new FormData();
  formData.append("message", message);

  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append("files", file);
    });
  }

  const result = await apiCall(
    `/api/deals/${dealId}/milestones/${milestoneIndex}/submit`,
    {
      method: "POST",
      body: formData,
    }
  );
  return result;
}

/**
 * Approve milestone and release payment (buyer approves)
 */
export async function approveAndReleaseMilestone(dealId, milestoneIndex) {
  const result = await apiCall(
    `/api/deals/${dealId}/milestones/${milestoneIndex}/approve`,
    {
      method: "POST",
    }
  );
  return result;
}

/**
 * Request milestone revision (buyer rejects)
 */
export async function requestMilestoneRevision(dealId, milestoneIndex, reason) {
  const result = await apiCall(
    `/api/deals/${dealId}/milestones/${milestoneIndex}/reject`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    }
  );
  return result;
}
