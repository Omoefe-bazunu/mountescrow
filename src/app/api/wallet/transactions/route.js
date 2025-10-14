// import { adminDb } from "@/lib/firebaseAdmin";
// import { NextResponse } from "next/server";

// export async function GET(request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const userId = searchParams.get("uid");

//     if (!userId) {
//       return NextResponse.json({ message: "Missing user ID" }, { status: 400 });
//     }

//     // Verify user exists in firestore
//     const userDoc = await adminDb.collection("users").doc(userId).get();
//     if (!userDoc.exists) {
//       return NextResponse.json({ message: "User not found" }, { status: 404 });
//     }

//     // Fetch transactions from Firestore
//     const transactionsSnapshot = await adminDb
//       .collection("transactions")
//       .where("userId", "==", userId)
//       .get();

//     const transactions = transactionsSnapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//     }));

//     return NextResponse.json({ transactions }, { status: 200 });
//   } catch (error) {
//     console.error("Fetch transactions error:", error);
//     return NextResponse.json(
//       { message: error.message || "Failed to fetch transactions" },
//       { status: 500 }
//     );
//   }
// }
