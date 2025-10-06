import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Certificate from "@/models/certificate";
import User from "@/models/user";
import VerificationRequest from "@/models/VerificationRequest";

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
      verifiedBy: institutionName
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
      verifiedBy: institutionName,
      updatedAt: { $gte: todayStart, $lte: todayEnd }
    });

    // 4. Count distinct students who have certificates verified by this institution
    const certificatesWithStudents = await Certificate.find({
      verifiedBy: institutionName
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
      { status: 500 }
    );
  }
}