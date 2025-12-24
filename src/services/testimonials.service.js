// src/services/testimonials.service.js

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

// Helper to get CSRF token from cookies
function getCsrfToken() {
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

  // Only add Content-Type if not FormData
  if (!(options.body instanceof FormData) && options.body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
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
 * Get all testimonials (public)
 */
export async function getAllTestimonials() {
  try {
    const data = await apiCall("/api/testimonials", {
      method: "GET",
    });
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
    return data.testimonial;
  } catch (error) {
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
    formData.append("authorName", testimonialData.authorName);
    formData.append("authorTitle", testimonialData.authorTitle);
    formData.append("review", testimonialData.review);
    formData.append("rating", testimonialData.rating.toString());

    if (testimonialData.photo) {
      formData.append("photo", testimonialData.photo);
    }

    const data = await apiCall("/api/testimonials", {
      method: "POST",
      body: formData,
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
