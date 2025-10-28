import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import SharedCertificate from "@/models/SharedCertificate";
import User from "@/models/user";

export async function GET(req, context) {
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
        JSON.stringify({ error: "Only employers can access this" }),
        { status: 403 }
      );
    }

    // ✅ Await params before accessing them
    const params = await context.params;
    const { studentId } = params;

    console.log('📍 Student ID from params:', studentId);

    if (!studentId) {
      return new Response(
        JSON.stringify({ error: "Student ID is required" }),
        { status: 400 }
      );
    }

    // Get student info
    const student = await User.findById(studentId);
    if (!student) {
      return new Response(
        JSON.stringify({ error: "Student not found" }),
        { status: 404 }
      );
    }

    console.log('👤 Found student:', student.name);

    // Get all certificates shared by this student with this employer
    const sharedCertificates = await SharedCertificate.find({
      employer: employer._id,
      student: studentId
    })
      .populate({
        path: "certificate",
        select: "title description ipfsCid verification createdAt updatedAt"
      })
      .sort({ sharedAt: -1 });

    console.log('📄 Found certificates:', sharedCertificates.length);

    const certificates = sharedCertificates.map(share => ({
      _id: share._id,
      certificateId: share.certificate._id,
      title: share.certificate.title,
      description: share.certificate.description,
      ipfsCid: share.certificate.ipfsCid,
      isVerified: share.certificate.verification?.isVerified || false,
      verifiedBy: share.certificate.verification?.isVerified 
        ? {
            institutionName: share.certificate.verification.verifiedBy.institutionName,
            institutionEmail: share.certificate.verification.verifiedBy.institutionEmail,
            verifiedAt: share.certificate.verification.signature.timestamp
          }
        : null,
      sharedAt: share.sharedAt,
      isReviewed: share.isReviewed,
      reviewedAt: share.reviewedAt,
      notes: share.notes,
      authenticityChecks: share.authenticityChecks,
      createdAt: share.certificate.createdAt
    }));

    return new Response(
      JSON.stringify({
        success: true,
        student: {
          _id: student._id,
          name: student.name,
          email: student.email
        },
        certificates,
        stats: {
          total: certificates.length,
          verified: certificates.filter(c => c.isVerified).length,
          reviewed: certificates.filter(c => c.isReviewed).length
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error fetching student certificates:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}