import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import SharedCertificate from "@/models/SharedCertificate";
import Certificate from "@/models/certificate";
import User from "@/models/user";

export async function POST(req) {
  await connectDB();

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    const { certificateIds, employerEmail } = await req.json();

    // Validate input
    if (!certificateIds || !Array.isArray(certificateIds) || certificateIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one certificate ID is required" }),
        { status: 400 }
      );
    }

    if (!employerEmail) {
      return new Response(
        JSON.stringify({ error: "Employer email is required" }),
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(employerEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400 }
      );
    }

    // Find student
    const student = await User.findOne({ email: session.user.email.toLowerCase() });
    if (!student || student.role !== "student") {
      return new Response(
        JSON.stringify({ error: "Only students can share certificates" }),
        { status: 403 }
      );
    }

    // Find employer - FIXED: Check if employer exists before using it
    const employer = await User.findOne({
      email: employerEmail.toLowerCase(),
      role: "employer"
    });

    if (!employer) {
      return new Response(
        JSON.stringify({ 
          error: "Employer not found. The email address is not registered as an employer in the system." 
        }),
        { status: 404 }
      );
    }

    // Check if trying to share with self
    if (student._id.toString() === employer._id.toString()) {
      return new Response(
        JSON.stringify({ error: "You cannot share certificates with yourself" }),
        { status: 400 }
      );
    }

    // Verify all certificates exist and belong to student
    const certificates = await Certificate.find({
      _id: { $in: certificateIds },
      student: student._id
    });

    if (certificates.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid certificates found" }),
        { status: 404 }
      );
    }

    if (certificates.length !== certificateIds.length) {
      return new Response(
        JSON.stringify({ 
          error: `Only ${certificates.length} out of ${certificateIds.length} certificates found. Some certificates don't belong to you or don't exist.` 
        }),
        { status: 404 }
      );
    }

    // Track successful shares and already shared
    const successfulShares = [];
    const alreadyShared = [];
    const errors = [];

    // Share each certificate
    for (const certificateId of certificateIds) {
      try {
        // Check if already shared
        const existingShare = await SharedCertificate.findOne({
          certificate: certificateId,
          student: student._id,
          employer: employer._id
        });

        if (existingShare) {
          // Get certificate title for better feedback
          const cert = certificates.find(c => c._id.toString() === certificateId.toString());
          alreadyShared.push({
            certificateId,
            title: cert?.title || 'Unknown'
          });
          continue;
        }

        // Create share record
        const share = await SharedCertificate.create({
          certificate: certificateId,
          student: student._id,
          employer: employer._id,
          sharedAt: new Date(),
          isReviewed: false,
          notes: null,
          authenticityChecks: []
        });

        // Get certificate title for feedback
        const cert = certificates.find(c => c._id.toString() === certificateId.toString());
        successfulShares.push({
          shareId: share._id,
          certificateId,
          title: cert?.title || 'Unknown'
        });

      } catch (error) {
        console.error(`Error sharing certificate ${certificateId}:`, error);
        errors.push({
          certificateId,
          error: error.message
        });
      }
    }

    // Build response message
    let message = '';
    let status = 200;

    if (successfulShares.length > 0) {
      message = `Successfully shared ${successfulShares.length} certificate(s) with ${employer.name}`;
    }

    if (alreadyShared.length > 0) {
      message += message ? '. ' : '';
      message += `${alreadyShared.length} certificate(s) were already shared`;
    }

    if (errors.length > 0) {
      message += message ? '. ' : '';
      message += `${errors.length} certificate(s) failed to share`;
      if (successfulShares.length === 0 && alreadyShared.length === 0) {
        status = 500;
      }
    }

    // If nothing was shared (all were already shared or failed)
    if (successfulShares.length === 0 && alreadyShared.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `All selected certificates are already shared with ${employer.name}`,
          sharedCount: 0,
          alreadySharedCount: alreadyShared.length,
          errorCount: 0,
          details: {
            alreadyShared: alreadyShared.map(s => s.title)
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: successfulShares.length > 0,
        message,
        sharedCount: successfulShares.length,
        alreadySharedCount: alreadyShared.length,
        errorCount: errors.length,
        employer: {
          name: employer.name,
          email: employer.email
        },
        details: {
          shared: successfulShares.map(s => ({ id: s.shareId, title: s.title })),
          alreadyShared: alreadyShared.map(s => s.title),
          errors: errors.length > 0 ? errors : undefined
        }
      }),
      { status: status, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error sharing certificates:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to share certificates",
        details: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// GET: Get shared certificates for current user (student view)
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

    const student = await User.findOne({ email: session.user.email.toLowerCase() });
    if (!student || student.role !== "student") {
      return new Response(
        JSON.stringify({ error: "Only students can view their shared certificates" }),
        { status: 403 }
      );
    }

    // Get all certificates shared by this student
    const sharedCertificates = await SharedCertificate.find({ student: student._id })
      .populate('certificate', 'title description ipfsCid verification createdAt')
      .populate('employer', 'name email')
      .sort({ sharedAt: -1 });

    // Group by employer
    const employerMap = new Map();

    sharedCertificates.forEach(share => {
      const employerId = share.employer._id.toString();
      
      if (!employerMap.has(employerId)) {
        employerMap.set(employerId, {
          employer: {
            _id: share.employer._id,
            name: share.employer.name,
            email: share.employer.email
          },
          certificates: [],
          totalShared: 0,
          reviewedCount: 0
        });
      }

      const employerData = employerMap.get(employerId);
      
      employerData.certificates.push({
        _id: share._id,
        certificateId: share.certificate._id,
        title: share.certificate.title,
        description: share.certificate.description,
        isVerified: share.certificate.verification?.isVerified || false,
        sharedAt: share.sharedAt,
        isReviewed: share.isReviewed,
        reviewedAt: share.reviewedAt
      });

      employerData.totalShared++;
      if (share.isReviewed) {
        employerData.reviewedCount++;
      }
    });

    const employers = Array.from(employerMap.values());

    return new Response(
      JSON.stringify({
        success: true,
        employers,
        totalEmployers: employers.length,
        totalCertificatesShared: sharedCertificates.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error fetching shared certificates:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch shared certificates",
        details: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}