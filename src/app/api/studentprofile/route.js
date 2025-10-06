import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Certificate from "@/models/certificate";
import User from "@/models/user";
import VerificationRequest from "@/models/verificationRequest";

// GET: Fetch student profile data
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
          encryptionKey: dbUser.encryptionKey, // Send as base64
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
    console.error("Error fetching student profile:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch profile data",
        details: error.message 
      }),
      { status: 500 }
    );
  }
}

// DELETE: Delete student account
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

    // Check if user is a student
    if (dbUser.role !== "student") {
      return new Response(
        JSON.stringify({ error: "Only students can delete their account" }),
        { status: 403 }
      );
    }

    const userId = dbUser._id;

    // Delete all certificates
    const deletedCertificates = await Certificate.deleteMany({
      student: userId
    });

    // Delete all verification requests
    const deletedRequests = await VerificationRequest.deleteMany({
      student: userId
    });

    // Delete the user account
    await User.findByIdAndDelete(userId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Account deleted successfully",
        deletedCertificates: deletedCertificates.deletedCount,
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