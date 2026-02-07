// export const dynamic = "force-dynamic";
// import { NextResponse } from "next/server";

// const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

// export async function GET(request, { params }) {
//   const cookie = request.headers.get("cookie") ?? "";
//   const { id } = await params;

//   const res = await fetch(`${BACKEND_URL}/api/proposals/${id}`, {
//     method: "GET",
//     headers: { Cookie: cookie },
//     credentials: "include",
//   });

//   if (!res.ok) {
//     return new NextResponse(await res.text(), { status: res.status });
//   }

//   const data = await res.json();
//   const proposal = data.proposal || data;

//   // Helper function to convert Firestore timestamp to ISO string
//   function convertTimestamp(timestamp) {
//     if (!timestamp) return null;

//     // Already a string (ISO format)
//     if (typeof timestamp === "string") {
//       return timestamp;
//     }

//     // Firestore timestamp object
//     const seconds = timestamp._seconds || timestamp.seconds;
//     const nanoseconds = timestamp._nanoseconds || timestamp.nanoseconds || 0;

//     if (seconds != null) {
//       return new Date(
//         seconds * 1000 + Math.round(nanoseconds / 1000000)
//       ).toISOString();
//     }

//     return null;
//   }

//   // Convert all timestamps
//   if (proposal.createdAt) {
//     proposal.createdAt = convertTimestamp(proposal.createdAt);
//   }

//   // Convert milestone due dates
//   if (proposal.milestones && Array.isArray(proposal.milestones)) {
//     proposal.milestones = proposal.milestones.map((milestone) => ({
//       ...milestone,
//       dueDate: convertTimestamp(milestone.dueDate),
//     }));
//   }

//   return NextResponse.json({ proposal }, { status: 200 });
// }

// export async function PATCH(request, { params }) {
//   try {
//     const { id } = await params;
//     const formData = await request.formData();

//     // Get cookies and CSRF token from the request
//     const cookieHeader = request.headers.get("cookie");
//     const csrfToken = request.headers.get("X-CSRF-Token");

//     // Forward the request to your backend
//     const response = await fetch(`${BACKEND_URL}/api/proposals/${id}`, {
//       method: "PATCH",
//       headers: {
//         Cookie: cookieHeader || "",
//         "X-CSRF-Token": csrfToken || "",
//       },
//       credentials: "include",
//       body: formData,
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       return NextResponse.json(
//         { error: data.error || "Failed to update proposal" },
//         { status: response.status }
//       );
//     }

//     return NextResponse.json(data, { status: 200 });
//   } catch (error) {
//     console.error("Proposal update proxy error:", error);
//     return NextResponse.json(
//       { error: "Failed to update proposal" },
//       { status: 500 }
//     );
//   }
// }

// app/api/proposals/[id]/route.js

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export async function GET(request, { params }) {
  const cookie = request.headers.get("cookie") ?? "";
  const { id } = await params;

  const res = await fetch(`${BACKEND_URL}/api/proposals/${id}`, {
    method: "GET",
    headers: { Cookie: cookie },
    credentials: "include",
  });

  if (!res.ok) {
    return new NextResponse(await res.text(), { status: res.status });
  }

  const data = await res.json();
  const proposal = data.proposal || data;

  // Helper function to convert Firestore timestamp to ISO string
  function convertTimestamp(timestamp) {
    if (!timestamp) return null;

    // Already a string (ISO format)
    if (typeof timestamp === "string") {
      return timestamp;
    }

    // Firestore timestamp object
    const seconds = timestamp._seconds || timestamp.seconds;
    const nanoseconds = timestamp._nanoseconds || timestamp.nanoseconds || 0;

    if (seconds != null) {
      return new Date(
        seconds * 1000 + Math.round(nanoseconds / 1000000),
      ).toISOString();
    }

    return null;
  }

  // Convert all timestamps
  if (proposal.createdAt) {
    proposal.createdAt = convertTimestamp(proposal.createdAt);
  }

  // Convert milestone due dates
  if (proposal.milestones && Array.isArray(proposal.milestones)) {
    proposal.milestones = proposal.milestones.map((milestone) => ({
      ...milestone,
      dueDate: convertTimestamp(milestone.dueDate),
    }));
  }

  return NextResponse.json({ proposal }, { status: 200 });
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const formData = await request.formData();

    // Approach mirrored from Proposal Create (POST):
    const cookieHeader = request.headers.get("cookie") ?? "";
    const csrfToken = request.headers.get("x-csrf-token") ?? ""; // Standardized to lowercase

    // Forward the request to your modular backend
    const res = await fetch(`${BACKEND_URL}/api/proposals/${id}`, {
      method: "PATCH",
      headers: {
        Cookie: cookieHeader,
        "x-csrf-token": csrfToken, // Forwarded security token
      },
      body: formData,
      credentials: "include",
    });

    // Handle non-JSON or error responses gracefully
    if (!res.ok) {
      const errorText = await res.text();
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(errorJson, { status: res.status });
      } catch {
        return NextResponse.json(
          { error: "Failed to update proposal" },
          { status: res.status },
        );
      }
    }

    const data = await res.json();
    const response = NextResponse.json(data, { status: 200 });

    // Handle multiple cookies correctly (Mirrored from Create approach)
    // This prevents the browser from merging JWT and CSRF into a broken string
    const setCookies = res.headers.getSetCookie
      ? res.headers.getSetCookie()
      : res.headers.get("set-cookie");

    if (setCookies) {
      if (Array.isArray(setCookies)) {
        setCookies.forEach((c) => response.headers.append("set-cookie", c));
      } else {
        response.headers.set("set-cookie", setCookies);
      }
    }

    return response;
  } catch (error) {
    console.error("Proposal update proxy error:", error);
    return NextResponse.json(
      { error: "Failed to update proposal" },
      { status: 500 },
    );
  }
}
