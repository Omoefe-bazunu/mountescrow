// app/api/notifications/count/route.js
export async function GET(request) {
  try {
    const cookieStore = cookies();
    const jwt = cookieStore.get("jwt")?.value;
    const csrfToken = cookieStore.get("csrf-token")?.value;

    if (!jwt) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/api/notifications/count`, {
      method: "GET",
      headers: {
        Cookie: `jwt=${jwt}; csrf-token=${csrfToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json(data, { status: response.status });
    }

    return Response.json(data);
  } catch (error) {
    console.error("Notification count API error:", error);
    return Response.json(
      { error: "Failed to fetch notification count" },
      { status: 500 }
    );
  }
}
