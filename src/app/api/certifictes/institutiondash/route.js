// app/api/certifictes/institutiondash/route.js
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Certificate from "@/models/certificate";
import User from "@/models/user";
import VerificationRequest from "@/models/VerificationRequest";

// ✅ Named export - no "default"
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

    // Check if user is an institution
    if (dbUser.role !== "institution") {
      return new Response(
        JSON.stringify({ error: "Access denied. Only institutions can access this dashboard." }),
        { status: 403 }
      );
    }

    const institutionId = dbUser._id;
    const institutionName = dbUser.name;

    // 1. Count total certificates verified by this institution
    const totalCertificates = await Certificate.countDocuments({
      "verification.isVerified": true,
      "verification.verifiedBy.institutionId": institutionId
    });

    // 2. Count pending verification requests for this institution
    const pendingRequests = await VerificationRequest.countDocuments({
      institution: institutionId,
      status: "pending"
    });

    // 3. Count approved requests today (certificates verified today)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const approvedToday = await Certificate.countDocuments({
      "verification.isVerified": true,
      "verification.verifiedBy.institutionId": institutionId,
      "verification.signature.timestamp": { $gte: todayStart, $lte: todayEnd }
    });

    // 4. Count distinct students who have certificates verified by this institution
    const certificatesWithStudents = await Certificate.find({
      "verification.isVerified": true,
      "verification.verifiedBy.institutionId": institutionId
    }).select('student').lean();

    // Extract unique student IDs
    const uniqueStudentIds = [...new Set(
      certificatesWithStudents.map(cert => cert.student.toString())
    )];
    
    const totalStudents = uniqueStudentIds.length;

    // 5. Get recent verification requests (last 5)
    const recentRequests = await VerificationRequest.find({
      institution: institutionId
    })
      .populate('student', 'name email')
      .populate('certificate', 'title description createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Format recent requests for frontend
    const formattedRequests = recentRequests.map(req => ({
      id: req._id,
      studentName: req.student?.name || 'Unknown',
      studentEmail: req.student?.email || '',
      certificateType: req.certificate?.title || 'Unknown Certificate',
      submissionDate: req.createdAt,
      status: req.status,
      certificateId: req.certificate?._id
    }));

    // 6. BONUS: Get monthly verification trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyVerifications = await Certificate.aggregate([
      {
        $match: {
          "verification.isVerified": true,
          "verification.verifiedBy.institutionId": institutionId,
          "verification.signature.timestamp": { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$verification.signature.timestamp" },
            month: { $month: "$verification.signature.timestamp" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    // Return the stats
    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          totalCertificates,
          pendingRequests,
          approvedToday,
          totalStudents
        },
        recentRequests: formattedRequests,
        monthlyTrend: monthlyVerifications,
        institution: {
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error fetching institution dashboard stats:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch dashboard statistics",
        details: error.message 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}