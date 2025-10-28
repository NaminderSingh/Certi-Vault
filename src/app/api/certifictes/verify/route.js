import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import VerificationRequest from "@/models/VerificationRequest";
import Certificate from "@/models/certificate";
import User from "@/models/user";
import crypto from "crypto";
import { generateEncryptionKey, createHMAC, createDocumentHash } from "@/utils/crypto";

// ------------------ POST: Create Verification Request ------------------
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

    const { certificateId, institutionEmail } = await req.json();

    if (!certificateId || !institutionEmail) {
      return new Response(
        JSON.stringify({ error: "Certificate ID and institution email are required" }), 
        { status: 400 }
      );
    }

    // Find student (logged-in user)
    const student = await User.findOne({ email: session.user.email.toLowerCase() });
    if (!student) {
      return new Response(
        JSON.stringify({ error: "Student not found" }), 
        { status: 404 }
      );
    }

    // Verify certificate belongs to student
    const certificate = await Certificate.findById(certificateId);
    if (!certificate) {
      return new Response(
        JSON.stringify({ error: "Certificate not found" }), 
        { status: 404 }
      );
    }

    if (certificate.student.toString() !== student._id.toString()) {
      return new Response(
        JSON.stringify({ error: "You can only request verification for your own certificates" }), 
        { status: 403 }
      );
    }

    // Check if already verified
    if (certificate.verification?.isVerified) {
      return new Response(
        JSON.stringify({ 
          error: "Certificate is already verified",
          verifiedBy: certificate.verification.verifiedBy.institutionName
        }), 
        { status: 400 }
      );
    }

    // Find institution by email
    const institution = await User.findOne({ 
      email: institutionEmail.toLowerCase(),
      role: "institution" 
    });
    
    if (!institution) {
      return new Response(
        JSON.stringify({ error: "Institution not found with this email" }), 
        { status: 404 }
      );
    }

    // Check for existing pending request
    const existingRequest = await VerificationRequest.findOne({
      certificate: certificateId,
      student: student._id,
      institution: institution._id,
      status: "pending",
    });

    if (existingRequest) {
      return new Response(
        JSON.stringify({ error: "Verification request already exists and is pending" }), 
        { status: 400 }
      );
    }

    // Create new verification request
    const newRequest = await VerificationRequest.create({
      certificate: certificateId,
      student: student._id,
      institution: institution._id,
      status: "pending",
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        request: newRequest,
        message: `Verification request sent to ${institution.name}`
      }), 
      { status: 200 }
    );

  } catch (error) {
    console.error("Verification request error:", error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500 }
    );
  }
}

// ------------------ GET: Fetch Verification Requests ------------------
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

    const institution = await User.findOne({ email: session.user.email.toLowerCase() });
    if (!institution || institution.role !== "institution") {
      return new Response(
        JSON.stringify({ error: "Only institutions can view requests" }), 
        { status: 403 }
      );
    }

    const requests = await VerificationRequest.find({ 
      institution: institution._id,
      status: "pending" // Only show pending requests
    })
      .populate("certificate", "title description ipfsCid encrypted verification student")
      .populate("student", "name email")
      .sort({ createdAt: -1 });

    // Decrypt PDFs for institution review
    const results = [];
    for (const req of requests) {
      try {
        const student = await User.findById(req.student._id);
        if (!student?.encryptionKey) {
          console.log("❌ Missing encryption key for student:", student?.email);
          continue;
        }

        const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${req.certificate.ipfsCid}`;
        const response = await fetch(ipfsUrl, { 
          headers: { Accept: "application/json" } 
        });
        
        if (!response.ok) {
          console.log("❌ Failed to fetch from IPFS:", req.certificate.ipfsCid);
          continue;
        }

        const ipfsData = await response.json();
        
        // Verify the certificate belongs to the student
        if (ipfsData.userId !== student._id.toString()) {
          console.log("❌ User ID mismatch");
          continue;
        }

        // Decrypt the certificate
        const encryptedData = Buffer.from(ipfsData.encryptedData, "base64");
        const iv = Buffer.from(ipfsData.iv, "base64");
        const authTag = Buffer.from(ipfsData.tag, "base64");
        const algorithm = (ipfsData.algorithm || "AES-256-GCM").toLowerCase();

        const keyBuffer = Buffer.from(student.encryptionKey, "base64");
        const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedData);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        const base64Pdf = decrypted.toString("base64");

        results.push({
          _id: req._id,
          status: req.status,
          createdAt: req.createdAt,
          student: { 
            name: req.student.name, 
            email: req.student.email 
          },
          certificate: {
            id: req.certificate._id,
            title: req.certificate.title,
            description: req.certificate.description,
            pdf: base64Pdf,
            isVerified: req.certificate.verification?.isVerified || false,
          },
        });
      } catch (err) {
        console.error(`Failed to decrypt certificate ${req.certificate._id}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ requests: results }), 
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching requests:", error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500 }
    );
  }
}

// ------------------ PATCH: Approve and Sign Certificate ------------------
export async function PATCH(req) {
  await connectDB();

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }), 
        { status: 401 }
      );
    }

    const institution = await User.findOne({ email: session.user.email.toLowerCase() });
    if (!institution || institution.role !== "institution") {
      return new Response(
        JSON.stringify({ error: "Only institutions can verify requests" }), 
        { status: 403 }
      );
    }

    // Ensure institution has encryption key
    if (!institution.encryptionKey) {
      institution.encryptionKey = generateEncryptionKey();
      await institution.save();
    }

    const { requestId, remarks } = await req.json();
    if (!requestId) {
      return new Response(
        JSON.stringify({ error: "Request ID is required" }), 
        { status: 400 }
      );
    }

    const request = await VerificationRequest.findById(requestId)
      .populate("certificate")
      .populate("student");

    if (!request) {
      return new Response(
        JSON.stringify({ error: "Verification request not found" }), 
        { status: 404 }
      );
    }

    // Verify request belongs to this institution
    if (request.institution.toString() !== institution._id.toString()) {
      return new Response(
        JSON.stringify({ error: "You can only verify requests sent to you" }), 
        { status: 403 }
      );
    }

    // Check if certificate is already verified
    if (request.certificate.verification?.isVerified) {
      return new Response(
        JSON.stringify({ 
          error: "Certificate is already verified",
          verifiedBy: request.certificate.verification.verifiedBy.institutionName
        }), 
        { status: 400 }
      );
    }

    console.log("Creating document hash and signature...");
    
    // ✅ CREATE DIGITAL SIGNATURE
    const documentHash = createDocumentHash(
      request.certificate.ipfsCid,
      request.certificate.title,
      request.certificate.student.toString()
    );

    const hmacSignature = createHMAC(documentHash, institution.encryptionKey);

    console.log("Document Hash:", documentHash);
    console.log("HMAC Signature:", hmacSignature);

    // ✅ Update certificate with verification and signature
    const certificate = await Certificate.findById(request.certificate._id);
    
    certificate.verification = {
      isVerified: true,
      verifiedBy: {
        institutionId: institution._id,
        institutionName: institution.name,
        institutionEmail: institution.email,
      },
      signature: {
        hmac: hmacSignature,
        signedHash: documentHash,
        timestamp: new Date(),
      },
    };

    await certificate.save();
    
    console.log("Certificate updated with verification:", certificate.verification);

    // ✅ Delete the verification request after approval
    await VerificationRequest.findByIdAndDelete(requestId);
    
    console.log("Verification request deleted:", requestId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Certificate verified and digitally signed successfully",
        certificate: {
          id: certificate._id,
          title: certificate.title,
          verifiedBy: institution.name,
          verification: certificate.verification,
        }
      }), 
      { status: 200 }
    );

  } catch (error) {
    console.error("Error verifying request:", error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500 }
    );
  }
}

// ------------------ DELETE: Reject Verification Request ------------------
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

    const institution = await User.findOne({ email: session.user.email.toLowerCase() });
    if (!institution || institution.role !== "institution") {
      return new Response(
        JSON.stringify({ error: "Only institutions can reject requests" }), 
        { status: 403 }
      );
    }

    const { requestId, remarks } = await req.json();
    if (!requestId) {
      return new Response(
        JSON.stringify({ error: "Request ID is required" }), 
        { status: 400 }
      );
    }

    const request = await VerificationRequest.findById(requestId);
    if (!request) {
      return new Response(
        JSON.stringify({ error: "Verification request not found" }), 
        { status: 404 }
      );
    }

    // Verify request belongs to this institution
    if (request.institution.toString() !== institution._id.toString()) {
      return new Response(
        JSON.stringify({ error: "You can only reject requests sent to you" }), 
        { status: 403 }
      );
    }

    // ✅ Delete the request after rejection
    await VerificationRequest.findByIdAndDelete(requestId);
    
    console.log("Verification request rejected and deleted:", requestId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Request rejected and removed successfully" 
      }), 
      { status: 200 }
    );

  } catch (error) {
    console.error("Error rejecting request:", error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500 }
    );
  }
}