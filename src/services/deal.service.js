// // services/deal.service.js - FIXED

// // Helper to get CSRF token
// function getCsrfToken() {
//   const cookies = document.cookie.split("; ");
//   const csrfCookie = cookies.find((c) => c.startsWith("csrf-token="));
//   return csrfCookie ? csrfCookie.split("=")[1] : null;
// }

// // Helper for API calls
// async function apiCall(endpoint, options = {}) {
//   const headers = {
//     ...options.headers,
//   };

//   // Add CSRF token for non-GET requests
//   const csrfToken = getCsrfToken();
//   if (options.method && options.method !== "GET" && csrfToken) {
//     headers["x-csrf-token"] = csrfToken;
//   }

//   // Only add Content-Type if not FormData
//   if (!(options.body instanceof FormData) && options.body) {
//     headers["Content-Type"] = "application/json";
//   }

//   const response = await fetch(endpoint, {
//     ...options,
//     headers,
//     credentials: "include",
//   });

//   if (!response.ok) {
//     const error = await response
//       .json()
//       .catch(() => ({ error: "Request failed" }));
//     throw new Error(error.error || `HTTP ${response.status}`);
//   }

//   return response.json();
// }

// export async function getDeals() {
//   const result = await apiCall("/api/deals", { method: "GET" });
//   return result.deals || [];
// }

// export async function getDealById(dealId) {
//   try {
//     const result = await apiCall(`/api/deals/${dealId}`, { method: "GET" });
//     return result.deal;
//   } catch (error) {
//     console.error("Error fetching deal:", error);
//     return null;
//   }
// }

// export async function createDealFromProposal(proposalId) {
//   const result = await apiCall("/api/deals/create-from-proposal", {
//     method: "POST",
//     body: JSON.stringify({ proposalId }),
//   });
//   return result.dealId;
// }

// export async function fundDeal(dealId) {
//   const result = await apiCall(`/api/deals/${dealId}/fund`, {
//     method: "POST",
//   });
//   return result;
// }

// export async function submitMilestoneWork(
//   dealId,
//   milestoneIndex,
//   message,
//   files
// ) {
//   const formData = new FormData();
//   formData.append("message", message);

//   if (files && files.length > 0) {
//     files.forEach((file) => {
//       formData.append("files", file);
//     });
//   }

//   const result = await apiCall(
//     `/api/deals/${dealId}/milestones/${milestoneIndex}/submit`,
//     {
//       method: "POST",
//       body: formData,
//     }
//   );
//   return result;
// }

// export async function approveAndReleaseMilestone(dealId, milestoneIndex) {
//   const result = await apiCall(
//     `/api/deals/${dealId}/milestones/${milestoneIndex}/approve`,
//     {
//       method: "POST",
//     }
//   );
//   return result;
// }

// export async function requestMilestoneRevision(dealId, milestoneIndex, reason) {
//   const result = await apiCall(
//     `/api/deals/${dealId}/milestones/${milestoneIndex}/reject`,
//     {
//       method: "POST",
//       body: JSON.stringify({ reason }),
//     }
//   );
//   return result;
// }

// services/deal.service.js

// Helper to get CSRF token
function getCsrfToken() {
  const cookies = document.cookie.split("; ");
  const csrfCookie = cookies.find((c) => c.startsWith("csrf-token="));
  return csrfCookie ? csrfCookie.split("=")[1] : null;
}

// Helper for API calls
async function apiCall(endpoint, options = {}) {
  const headers = {
    ...options.headers,
  };

  // Add CSRF token for non-GET requests
  const csrfToken = getCsrfToken();
  if (options.method && options.method !== "GET" && csrfToken) {
    headers["x-csrf-token"] = csrfToken;
  }

  // Only add Content-Type if not FormData
  if (!(options.body instanceof FormData) && options.body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: "include",
  });

  // Get the response text first to handle both JSON and non-JSON responses
  const responseText = await response.text();

  if (!response.ok) {
    // Try to parse as JSON, fall back to plain text
    let errorData;
    try {
      errorData = JSON.parse(responseText);
    } catch {
      errorData = { error: responseText || "Request failed" };
    }
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  // Try to parse successful response as JSON
  try {
    return JSON.parse(responseText);
  } catch {
    throw new Error("Server returned invalid JSON response");
  }
}

// Submit milestone work (this will trigger auto-start-countdown)
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

  // Submit the milestone work
  const result = await apiCall(
    `/api/deals/${dealId}/milestones/${milestoneIndex}/submit`,
    {
      method: "POST",
      body: formData,
    }
  );

  // After successful submission, start the countdown
  if (result.success) {
    try {
      // Wait 1 second to ensure submission is fully processed
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Start the countdown automatically
      await apiCall(
        `/api/deals/${dealId}/milestones/${milestoneIndex}/auto-start-countdown`,
        {
          method: "POST",
        }
      );

      // Update the result to indicate countdown started
      result.countdownStarted = true;
    } catch (countdownError) {
      console.warn("Countdown start failed:", countdownError);
      // Continue with the result - countdown failure shouldn't break submission
      result.countdownStarted = false;
      result.countdownError = countdownError.message;
    }
  }

  return result;
}

// Export other functions if needed
export async function getDeals() {
  const result = await apiCall("/api/deals", { method: "GET" });
  return result.deals || [];
}

export async function getDealById(dealId) {
  try {
    const result = await apiCall(`/api/deals/${dealId}`, { method: "GET" });
    return result.deal;
  } catch (error) {
    console.error("Error fetching deal:", error);
    return null;
  }
}

export async function createDealFromProposal(proposalId) {
  const result = await apiCall("/api/deals/create-from-proposal", {
    method: "POST",
    body: JSON.stringify({ proposalId }),
  });
  return result.dealId;
}

export async function fundDeal(dealId) {
  const result = await apiCall(`/api/deals/${dealId}/fund`, {
    method: "POST",
  });
  return result;
}

export async function approveAndReleaseMilestone(dealId, milestoneIndex) {
  const result = await apiCall(
    `/api/deals/${dealId}/milestones/${milestoneIndex}/approve`,
    {
      method: "POST",
    }
  );
  return result;
}

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
