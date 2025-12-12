// // services/notification.service.js

// // Helper to get CSRF token from cookies
// function getCsrfToken() {
//   const cookies = document.cookie.split("; ");
//   const csrfCookie = cookies.find((c) => c.startsWith("csrf-token="));
//   return csrfCookie ? csrfCookie.split("=")[1] : null;
// }

// // Helper for API calls (using Next.js API routes as proxy)
// async function apiCall(endpoint, options = {}) {
//   const csrfToken = getCsrfToken();

//   const headers = {
//     ...options.headers,
//   };

//   // Add CSRF token for non-GET requests
//   if (options.method && options.method !== "GET" && csrfToken) {
//     headers["x-csrf-token"] = csrfToken;
//   }

//   // Only add Content-Type if not FormData
//   if (!(options.body instanceof FormData) && options.body) {
//     headers["Content-Type"] = "application/json";
//   }

//   // Use relative paths - Next.js API routes will proxy to backend
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

// // Get notifications
// export async function getNotifications(page = 1, limit = 20) {
//   const result = await apiCall(
//     `/api/notifications?page=${page}&limit=${limit}`,
//     {
//       method: "GET",
//     }
//   );
//   return result;
// }

// // Get notification count
// export async function getNotificationCount() {
//   const result = await apiCall("/api/notifications/count", {
//     method: "GET",
//   });
//   return result;
// }

// // Mark notification as read
// export async function markNotificationAsRead(notificationId) {
//   const result = await apiCall(`/api/notifications/${notificationId}/read`, {
//     method: "PATCH",
//   });
//   return result;
// }

// // Mark all notifications as read
// export async function markAllNotificationsAsRead() {
//   const result = await apiCall("/api/notifications/mark-all-read", {
//     method: "PATCH",
//   });
//   return result;
// }

// // Delete notification
// export async function deleteNotification(notificationId) {
//   const result = await apiCall(`/api/notifications/${notificationId}`, {
//     method: "DELETE",
//   });
//   return result;
// }

// // Subscribe to real-time notifications
// export function subscribeToNotifications(callback) {
//   console.log("Real-time notification subscription not implemented yet");
// }
