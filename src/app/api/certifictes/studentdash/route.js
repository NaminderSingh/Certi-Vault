import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Certificate from "@/models/certificate";
import User from "@/models/user";
import VerificationRequest from "@/models/VerificationRequest";
import SharedCertificate from "@/models/SharedCertificate";

export async function GET(req) {
  await connectDB();

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

    // 2. Count verified certificates - FIXED: Use correct nested path
    const verifiedCertificates = await Certificate.countDocuments({
      student: userId,
      "verification.isVerified": true
    });

    // 3. Count pending verification requests
    const pendingRequests = await VerificationRequest.countDocuments({
      student: userId,
      status: "pending"
    });

    // 4. Count shared documents - FIXED: Query from SharedCertificate model
    const sharedDocuments = await SharedCertificate.countDocuments({
      student: userId
    });

    // 5. BONUS: Get verification rate percentage
    const verificationRate = totalCertificates > 0 
      ? Math.round((verifiedCertificates / totalCertificates) * 100) 
      : 0;

    // 6. BONUS: Count distinct employers shared with
    const distinctEmployers = await SharedCertificate.distinct('employer', {
      student: userId
    });
    const employersSharedWith = distinctEmployers.length;

    // 7. BONUS: Get recent activity (last 5 certificates)
    const recentCertificates = await Certificate.find({
      student: userId
    })
      .select('title createdAt verification.isVerified')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentActivity = recentCertificates.map(cert => ({
      id: cert._id,
      title: cert.title,
      uploadedAt: cert.createdAt,
      isVerified: cert.verification?.isVerified || false
    }));

    // Return the stats
    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          totalCertificates,
          verifiedCertificates,
          pendingRequests,
          sharedDocuments,
          verificationRate,
          employersSharedWith
        },
        recentActivity,
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
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}