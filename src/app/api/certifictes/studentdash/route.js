import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Certificate from "@/models/certificate";
import User from "@/models/user";
import VerificationRequest from "@/models/VerificationRequest";

export async function GET(req) {
  await connectDB();
//hello form 
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    if (!session) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    const userEmail = session.user.email;

    // Fetch user from database
    const dbUser = await User.findOne({ email: userEmail });
    if (!dbUser) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404 }
      );
    }

    // Check if user is a student
    if (dbUser.role !== "student") {
      return new Response(
        JSON.stringify({ error: "Access denied. Only students can access this dashboard." }),
        { status: 403 }
      );
    }

    const userId = dbUser._id;

    // 1. Count total certificates for this student
    const totalCertificates = await Certificate.countDocuments({
      student: userId
    });

    // 2. Count verified certificates (where verifiedBy is not null)
    const verifiedCertificates = await Certificate.countDocuments({
      student: userId,
      verifiedBy: { $ne: null }
    });

    // 3. Count pending verification requests
    const pendingRequests = await VerificationRequest.countDocuments({
      student: userId,
      status: "pending"
    });

    // 4. Optional: Get list of shared documents (if you have a sharing mechanism)
    // For now, we'll set it to 0 or you can implement your own logic
    const sharedDocuments = 0;

    // Return the stats
    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          totalCertificates,
          verifiedCertificates,
          pendingRequests,
          sharedDocuments
        },
        user: {
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error fetching student dashboard stats:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch dashboard statistics",
        details: error.message 
      }),
      { status: 500 }
    );
  }
}