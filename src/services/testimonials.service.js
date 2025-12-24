// src/services/testimonials.service.js

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
    ...options.headers,
  };

  // Add CSRF token for non-GET requests
  if (options.method && options.method !== "GET" && csrfToken) {
    headers["x-csrf-token"] = csrfToken;
  }

  // Only add Content-Type if not FormData and if body exists
  if (!(options.body instanceof FormData) && options.body) {
    headers["Content-Type"] = "application/json";
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
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Get all testimonials (public)
 */
export async function getAllTestimonials() {
  try {
    const data = await apiCall("/api/testimonials", {
      method: "GET",
    });
    // Return testimonials array directly
    return data.testimonials || [];
  } catch (error) {
    console.error("Get testimonials error:", error);
    throw error;
  }
}

/**
 * Get current user's testimonial
 */
export async function getMyTestimonial() {
  try {
    const data = await apiCall("/api/testimonials/my", {
      method: "GET",
    });
    // Return testimonial object directly
    return data.testimonial || null;
  } catch (error) {
    // If it's a 404 (not found), return null instead of throwing
    if (error.message.includes("404")) {
      return null;
    }
    console.error("Get my testimonial error:", error);
    throw error;
  }
}

/**
 * Create new testimonial
 */
export async function createTestimonial(testimonialData) {
  try {
    const formData = new FormData();

    // Append required fields
    formData.append("authorName", testimonialData.authorName);
    formData.append("authorTitle", testimonialData.authorTitle);
    formData.append("review", testimonialData.review);
    formData.append("rating", testimonialData.rating.toString());

    // Append photo if provided
    if (testimonialData.photo) {
      formData.append("photo", testimonialData.photo);
    }

    const data = await apiCall("/api/testimonials", {
      method: "POST",
      body: formData,
      // Note: No Content-Type header for FormData - browser sets it automatically
    });

    return data;
  } catch (error) {
    console.error("Create testimonial error:", error);
    throw error;
  }
}

/**
 * Update existing testimonial
 */
export async function updateTestimonial(id, testimonialData) {
  try {
    const formData = new FormData();

    formData.append("authorName", testimonialData.authorName);
    formData.append("authorTitle", testimonialData.authorTitle);
    formData.append("review", testimonialData.review);
    formData.append("rating", testimonialData.rating.toString());

    if (testimonialData.photo) {
      formData.append("photo", testimonialData.photo);
    }

    const data = await apiCall(`/api/testimonials/${id}`, {
      method: "PATCH",
      body: formData,
    });

    return data;
  } catch (error) {
    console.error("Update testimonial error:", error);
    throw error;
  }
}

/**
 * Delete testimonial
 */
export async function deleteTestimonial(id) {
  try {
    const data = await apiCall(`/api/testimonials/${id}`, {
      method: "DELETE",
    });

    return data;
  } catch (error) {
    console.error("Delete testimonial error:", error);
    throw error;
  }
}

/**
 * Get single testimonial by ID (if needed)
 */
export async function getTestimonialById(id) {
  try {
    const data = await apiCall(`/api/testimonials/${id}`, {
      method: "GET",
    });
    return data.testimonial || null;
  } catch (error) {
    console.error("Get testimonial by ID error:", error);
    throw error;
  }
}
