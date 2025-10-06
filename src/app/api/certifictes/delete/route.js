import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Certificate from "@/models/certificate";
import User from "@/models/user";
import VerificationRequest from "@/models/verificationRequest";

export async function DELETE(req) {
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

    // Get the certificateId from request body
    const { certificateId } = await req.json();

    if (!certificateId) {
      return new Response(
        JSON.stringify({ error: "Certificate ID is required" }),
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
        JSON.stringify({ error: "Only students can delete certificates" }),
        { status: 403 }
      );
    }

    const userId = dbUser._id;

    // Find the certificate and verify ownership
    const certificate = await Certificate.findById(certificateId);

    if (!certificate) {
      return new Response(
        JSON.stringify({ error: "Certificate not found" }),
        { status: 404 }
      );
    }

    // Verify that the certificate belongs to the logged-in student
    if (certificate.student.toString() !== userId.toString()) {
      return new Response(
        JSON.stringify({ error: "You are not authorized to delete this certificate" }),
        { status: 403 }
      );
    }

    // Delete all associated verification requests
    const deletedRequests = await VerificationRequest.deleteMany({
      certificate: certificateId
    });

    // Delete the certificate
    await Certificate.findByIdAndDelete(certificateId);

    // Optional: You can also delete the file from IPFS here if you want
    // However, IPFS is immutable, so typically you'd just remove the reference
    // and let the content be garbage collected if unpinned

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Certificate and associated verification requests deleted successfully",
        deletedVerificationRequests: deletedRequests.deletedCount
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error deleting certificate:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to delete certificate",
        details: error.message 
      }),
      { status: 500 }
    );
  }
}