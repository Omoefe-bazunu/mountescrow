// services/storage.service.js

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
];

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

  // Only add Content-Type if not FormData (browser sets it automatically for FormData)
  if (!(options.body instanceof FormData) && options.body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
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
 * Validate file on client side before upload
 */
export async function validateFile(file) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      "File type not allowed. Please upload images, PDFs, documents, or zip files."
    );
  }
}

/**
 * Upload a single milestone file through backend
 */
export async function uploadMilestoneFile(dealId, milestoneIndex, file) {
  await validateFile(file);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("dealId", dealId);
  formData.append("milestoneIndex", milestoneIndex.toString());

  const result = await apiCall("/api/files/upload-milestone", {
    method: "POST",
    body: formData,
  });

  return {
    name: result.fileName,
    url: result.fileUrl,
    size: file.size,
    type: file.type,
    uploadedAt: new Date(),
  };
}

/**
 * Upload multiple files for a milestone
 */
export async function uploadMultipleFiles(dealId, milestoneIndex, files) {
  if (files.length > 5) {
    throw new Error("Maximum 5 files allowed per milestone");
  }

  const uploadPromises = Array.from(files).map((file) =>
    uploadMilestoneFile(dealId, milestoneIndex, file)
  );

  return Promise.all(uploadPromises);
}

/**
 * Delete a file through backend
 */
export async function deleteFile(fileUrl) {
  try {
    await apiCall("/api/files/delete", {
      method: "DELETE",
      body: JSON.stringify({ fileUrl }),
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    // Don't throw error for delete failures as it's not critical
  }
}
