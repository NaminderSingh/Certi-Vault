import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import SharedCertificate from "@/models/SharedCertificate";
import User from "@/models/user";
import Certificate from "@/models/certificate";

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
        JSON.stringify({ error: "Only employers can access shared certificates" }),
        { status: 403 }
      );
    }

    // Get all shared certificates for this employer
    const sharedCertificates = await SharedCertificate.find({ employer: employer._id })
      .populate({
        path: "certificate",
        select: "title description ipfsCid verification createdAt updatedAt"
      })
      .populate("student", "name email")
      .sort({ sharedAt: -1 });

    // Group by student
    const studentMap = new Map();

    sharedCertificates.forEach(share => {
      const studentId = share.student._id.toString();
      
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          student: {
            _id: share.student._id,
            name: share.student.name,
            email: share.student.email
          },
          certificates: [],
          totalShared: 0,
          verifiedCount: 0,
          unviewedCount: 0
        });
      }

      const studentData = studentMap.get(studentId);
      
      studentData.certificates.push({
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
        notes: share.notes,
        createdAt: share.certificate.createdAt
      });

      studentData.totalShared++;
      if (share.certificate.verification?.isVerified) {
        studentData.verifiedCount++;
      }
      if (!share.isReviewed) {
        studentData.unviewedCount++;
      }
    });

    // Convert map to array
    const students = Array.from(studentMap.values());

    return new Response(
      JSON.stringify({
        success: true,
        students,
        totalStudents: students.length,
        totalCertificates: sharedCertificates.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error fetching shared certificates:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}