import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Certificate from "@/models/certificate";
import User from "@/models/user";

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

    // Fetch user ID from User schema
    const dbUser = await User.findOne({ email: userEmail });
    if (!dbUser) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404 }
      );
    }

    const userId = dbUser._id;

    // Fetch certificates for logged-in user with verification details
    const certificates = await Certificate.find(
      { student: userId },
      {
        title: 1,
        description: 1,
        ipfsCid: 1,
        createdAt: 1,
        updatedAt: 1,
        // ✅ Include verification information
        "verification.isVerified": 1,
        "verification.verifiedBy.institutionName": 1,
        "verification.verifiedBy.institutionEmail": 1,
        "verification.signature.timestamp": 1,
      }
    )
    .lean()
    .sort({ createdAt: -1 }); // ✅ Sort by newest first

    // ✅ Format the response for easier frontend consumption
    const formattedCertificates = certificates.map(cert => ({
      _id: cert._id,
      title: cert.title,
      description: cert.description,
      ipfsCid: cert.ipfsCid,
      createdAt: cert.createdAt,
      updatedAt: cert.updatedAt,
      isVerified: cert.verification?.isVerified || false,
      verifiedBy: cert.verification?.isVerified ? {
        institutionName: cert.verification.verifiedBy?.institutionName || "Unknown",
        institutionEmail: cert.verification.verifiedBy?.institutionEmail || null,
        verifiedAt: cert.verification.signature?.timestamp || null,
      } : null,
    }));
    console.log(formattedCertificates);
    return new Response(
      JSON.stringify({ certificates: formattedCertificates }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error fetching certificates:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch certificates" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}