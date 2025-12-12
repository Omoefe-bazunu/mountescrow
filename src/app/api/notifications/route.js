// import { NextResponse } from "next/server";

// const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

// export async function GET(request) {
//   try {
//     const cookie = request.headers.get("cookie") || "";
//     const csrfToken = request.headers.get("x-csrf-token") || "";
//     const { searchParams } = new URL(request.url);

//     // Build query string
//     const queryParams = new URLSearchParams();
//     if (searchParams.get("page"))
//       queryParams.set("page", searchParams.get("page"));
//     if (searchParams.get("limit"))
//       queryParams.set("limit", searchParams.get("limit"));

//     const queryString = queryParams.toString();
//     const url = queryString
//       ? `${BACKEND_URL}/api/notifications?${queryString}`
//       : `${BACKEND_URL}/api/notifications`;

//     const res = await fetch(url, {
//       method: "GET",
//       headers: {
//         Cookie: cookie,
//         "x-csrf-token": csrfToken,
//       },
//       credentials: "include",
//     });

//     if (!res.ok) {
//       const errorText = await res.text();
//       return NextResponse.json(
//         { error: `Backend error: ${res.status}` },
//         { status: res.status }
//       );
//     }

//     const data = await res.json();
//     return NextResponse.json(data, { status: 200 });
//   } catch (error) {
//     console.error("Notifications API route error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// export async function DELETE(request, { params }) {
//   try {
//     const cookie = request.headers.get("cookie") || "";
//     const csrfToken = request.headers.get("x-csrf-token") || "";
//     const { id } = params;

//     const res = await fetch(`${BACKEND_URL}/api/notifications/${id}`, {
//       method: "DELETE",
//       headers: {
//         Cookie: cookie,
//         "x-csrf-token": csrfToken,
//       },
//       credentials: "include",
//     });

//     if (!res.ok) {
//       const text = await res.text();
//       return new NextResponse(text, { status: res.status });
//     }

//     const data = await res.json();
//     return NextResponse.json(data, { status: 200 });
//   } catch (error) {
//     console.error("Delete notification API route error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

import { cookies } from "next/headers";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function GET(request) {
  try {
    const cookieStore = cookies();
    const jwt = cookieStore.get("jwt")?.value;
    const csrfToken = cookieStore.get("csrf-token")?.value;

    if (!jwt) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query params from request URL
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "20";

    const response = await fetch(
      `${BACKEND_URL}/api/notifications?page=${page}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          Cookie: `jwt=${jwt}; csrf-token=${csrfToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(data, { status: response.status });
    }

    return Response.json(data);
  } catch (error) {
    console.error("Notifications API error:", error);
    return Response.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
