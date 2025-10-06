import connectDB from "@/lib/db";
import Certificate from "@/models/certificate";
import User from "@/models/user";
import VerificationRequest from "@/models/VerificationRequest";
import jwt from "jsonwebtoken";

export async function GET(req) {
  await connectDB();

  try {
    // Only accept JWT token (extension only)
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Token required" }),
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401 }
      );
    }

    const userEmail = decoded.email;

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
        JSON.stringify({ error: "Only students can access this profile" }),
        { status: 403 }
      );
    }

    const userId = dbUser._id;

    // Count total certificates
    const totalCertificates = await Certificate.countDocuments({
      student: userId
    });

    // Count verified certificates
    const verifiedCertificates = await Certificate.countDocuments({
      student: userId,
      verifiedBy: { $ne: null }
    });

    // Count pending requests
    const pendingRequests = await VerificationRequest.countDocuments({
      student: userId,
      status: "pending"
    });

    // Return profile data
    return new Response(
      JSON.stringify({
        success: true,
        profile: {
          name: dbUser.name,
          email: dbUser.email,
          image: dbUser.image || null,
          role: dbUser.role,
          provider: dbUser.provider,
          createdAt: dbUser.createdAt,
          stats: {
            totalCertificates,
            verifiedCertificates,
            pendingRequests
          }
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error fetching extension profile:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch profile data",
        details: error.message 
      }),
      { status: 500 }
    );
  }
}