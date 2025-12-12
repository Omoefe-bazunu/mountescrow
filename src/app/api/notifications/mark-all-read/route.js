// app/api/notifications/mark-all-read/route.js
export async function PATCH(request) {
  try {
    const cookieStore = cookies();
    const jwt = cookieStore.get("jwt")?.value;
    const csrfToken = cookieStore.get("csrf-token")?.value;

    if (!jwt || !csrfToken) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(
      `${BACKEND_URL}/api/notifications/mark-all-read`,
      {
        method: "PATCH",
        headers: {
          Cookie: `jwt=${jwt}; csrf-token=${csrfToken}`,
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(data, { status: response.status });
    }

    return Response.json(data);
  } catch (error) {
    console.error("Mark all read API error:", error);
    return Response.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
}
