// app/api/employer/dashboard/route.js
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import SharedCertificate from "@/models/SharedCertificate";
import User from "@/models/user";
import certificate from "@/models/certificate";
export async function GET(req) {
  await connectDB();

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    const employer = await User.findOne({ email: session.user.email.toLowerCase() });
    if (!employer || employer.role !== "employer") {
      return new Response(
        JSON.stringify({ error: "Only employers can access this dashboard" }),
        { status: 403 }
      );
    }

    // Get all shared certificates for this employer
    const allShares = await SharedCertificate.find({ employer: employer._id })
      .populate({
        path: "certificate",
        select: "title verification createdAt"
      })
      .populate("student", "name email")
      .sort({ sharedAt: -1 });

    // Calculate stats
    const totalShared = allShares.length;
    const pendingReview = allShares.filter(share => !share.isReviewed).length;
    const verifiedCertificates = allShares.filter(
      share => share.certificate?.verification?.isVerified
    ).length;
    
    // Count unique students
    const uniqueStudents = new Set(allShares.map(share => share.student._id.toString()));
    const totalStudents = uniqueStudents.size;

    // Get recent 5 shares
    const recentShares = allShares.slice(0, 5);

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          totalShared,
          pendingReview,
          verifiedCertificates,
          totalStudents
        },
        recentShares,
        employer: {
          name: employer.name,
          email: employer.email
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error fetching employer dashboard:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}