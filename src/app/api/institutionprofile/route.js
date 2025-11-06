import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Certificate from "@/models/certificate";
import User from "@/models/user";
import VerificationRequest from "@/models/VerificationRequest";

// GET: Fetch institution profile data
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
        JSON.stringify({ error: "Only institutions can access this profile" }),
        { status: 403 }
      );
    }

    const userId = dbUser._id;

    // Count total certificates issued
    const totalCertificatesIssued = await Certificate.countDocuments({
      "verification.verifiedBy.institutionId": userId,
      "verification.isVerified": true
    });

    // Count pending verification requests
    const pendingRequests = await VerificationRequest.countDocuments({
      institution: userId,
      status: "pending"
    });

    // Count approved requests (this month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const approvedThisMonth = await VerificationRequest.countDocuments({
      institution: userId,
      status: "approved",
      updatedAt: { $gte: startOfMonth }
    });

    // Count unique students verified
    const verifiedCertificates = await Certificate.find({
      "verification.verifiedBy.institutionId": userId,
      "verification.isVerified": true
    }).distinct("student");

    const totalStudents = verifiedCertificates.length;

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
          encryptionKey: dbUser.encryptionKey, // Send as base64
          stats: {
            totalCertificatesIssued,
            pendingRequests,
            approvedThisMonth,
            totalStudents
          }
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error fetching institution profile:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch profile data",
        details: error.message 
      }),
      { status: 500 }
    );
  }
}

// DELETE: Delete institution account
export async function DELETE(req) {
  await connectDB();

  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    const { confirmEmail } = await req.json();
    const userEmail = session.user.email;

    // Verify the email matches
    if (confirmEmail !== userEmail) {
      return new Response(
        JSON.stringify({ error: "Email confirmation does not match" }),
        { status: 400 }
      );
    }

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
        JSON.stringify({ error: "Only institutions can delete their account" }),
        { status: 403 }
      );
    }

    const userId = dbUser._id;

    // Remove verification signatures from certificates (set to unverified)
    const updatedCertificates = await Certificate.updateMany(
      { "verification.verifiedBy.institutionId": userId },
      {
        $set: {
          "verification.isVerified": false,
          "verification.verifiedBy": {
            institutionId: null,
            institutionName: null,
            institutionEmail: null
          },
          "verification.signature": {
            hmac: null,
            signedHash: null,
            timestamp: null
          }
        }
      }
    );

    // Delete all verification requests
    const deletedRequests = await VerificationRequest.deleteMany({
      institution: userId
    });

    // Delete the user account
    await User.findByIdAndDelete(userId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Account deleted successfully",
        updatedCertificates: updatedCertificates.modifiedCount,
        deletedRequests: deletedRequests.deletedCount
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error deleting account:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to delete account",
        details: error.message 
      }),
      { status: 500 }
    );
  }
}