import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import SharedCertificate from "@/models/SharedCertificate";
import User from "@/models/user";

// GET: Fetch employer profile data
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

    // Check if user is an employer
    if (dbUser.role !== "employer") {
      return new Response(
        JSON.stringify({ error: "Only employers can access this profile" }),
        { status: 403 }
      );
    }

    const userId = dbUser._id;

    // Count total shared certificates
    const totalShared = await SharedCertificate.countDocuments({
      employer: userId
    });

    // Count reviewed certificates
    const reviewedCertificates = await SharedCertificate.countDocuments({
      employer: userId,
      isReviewed: true
    });

    // Count verified certificates
    const sharedCerts = await SharedCertificate.find({
      employer: userId
    }).populate("certificate", "verification");

    const verifiedCount = sharedCerts.filter(
      sc => sc.certificate?.verification?.isVerified
    ).length;

    // Count unique students
    const uniqueStudents = await SharedCertificate.find({
      employer: userId
    }).distinct("student");

    const totalStudents = uniqueStudents.length;

    // Count authenticity checks performed
    const allShared = await SharedCertificate.find({
      employer: userId
    });

    const totalAuthenticityChecks = allShared.reduce(
      (sum, sc) => sum + (sc.authenticityChecks?.length || 0),
      0
    );

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
            totalShared,
            reviewedCertificates,
            verifiedCount,
            totalStudents,
            totalAuthenticityChecks
          }
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error fetching employer profile:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch profile data",
        details: error.message 
      }),
      { status: 500 }
    );
  }
}

// DELETE: Delete employer account
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

    // Check if user is an employer
    if (dbUser.role !== "employer") {
      return new Response(
        JSON.stringify({ error: "Only employers can delete their account" }),
        { status: 403 }
      );
    }

    const userId = dbUser._id;

    // Delete all shared certificate records
    const deletedShares = await SharedCertificate.deleteMany({
      employer: userId
    });

    // Delete the user account
    await User.findByIdAndDelete(userId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Account deleted successfully",
        deletedShares: deletedShares.deletedCount
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