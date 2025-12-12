// app/api/notifications/[id]/route.js
export async function PATCH(request, { params }) {
  try {
    const cookieStore = cookies();
    const jwt = cookieStore.get("jwt")?.value;
    const csrfToken = cookieStore.get("csrf-token")?.value;

    if (!jwt || !csrfToken) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const response = await fetch(
      `${BACKEND_URL}/api/notifications/${id}/read`,
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
    console.error("Mark as read API error:", error);
    return Response.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const cookieStore = cookies();
    const jwt = cookieStore.get("jwt")?.value;
    const csrfToken = cookieStore.get("csrf-token")?.value;

    if (!jwt || !csrfToken) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const response = await fetch(`${BACKEND_URL}/api/notifications/${id}`, {
      method: "DELETE",
      headers: {
        Cookie: `jwt=${jwt}; csrf-token=${csrfToken}`,
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json(data, { status: response.status });
    }

    return Response.json(data);
  } catch (error) {
    console.error("Delete notification API error:", error);
    return Response.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}
