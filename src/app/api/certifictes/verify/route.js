import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import VerificationRequest from "@/models/VerificationRequest";
import Certificate from "@/models/certificate";
import User from "@/models/user";
import crypto from "crypto";
// ------------------ POST: Create Verification Request ------------------
export async function POST(req) {
  await connectDB();

  try {
    const session = await getServerSession(authOptions);
    if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { certificateId, institutionEmail } = await req.json();

    // Find student (logged-in user)
    const student = await User.findOne({ email: session.user.email.toLowerCase() });
    if (!student) return new Response(JSON.stringify({ error: "Student not found" }), { status: 404 });

    // Find institution by email
    const institution = await User.findOne({ email: institutionEmail.toLowerCase() });
    if (!institution) return new Response(JSON.stringify({ error: "Institution not found" }), { status: 404 });

    // Check for existing pending request
    const existingRequest = await VerificationRequest.findOne({
      certificate: certificateId,
      student: student._id,
      institution: institution._id,
      status: "pending",
    });
    if (existingRequest) return new Response(JSON.stringify({ error: "Verification request already exists" }), { status: 400 });

    // Create new verification request
    const newRequest = await VerificationRequest.create({
      certificate: certificateId,
      student: student._id,
      institution: institution._id,
      status: "pending",
    });

    return new Response(JSON.stringify({ success: true, request: newRequest }), { status: 200 });

  } catch (error) {
    console.error("Verification request error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// ------------------ GET: Fetch Verification Requests ------------------
export async function GET(req) {
  await connectDB();

  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const institution = await User.findOne({ email: session.user.email.toLowerCase() });
    if (!institution || institution.role !== "institution") {
      return new Response(JSON.stringify({ error: "Only institutions can view requests" }), { status: 403 });
    }

    const requests = await VerificationRequest.find({ institution: institution._id })
      .populate("certificate", "title description ipfsCid encrypted verifiedBy student")
      .populate("student", "name email")
      .sort({ createdAt: -1 });

    // Decrypt PDFs like in "myfiles"
    const results = [];
    for (const req of requests) {
      try {
        const student = await User.findById(req.student._id);
        if (!student?.encryptionKey) continue;

        const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${req.certificate.ipfsCid}`;
        const response = await fetch(ipfsUrl, { headers: { Accept: "application/json" } });
        if (!response.ok) continue;

        const ipfsData = await response.json();
        if (ipfsData.userId !== student._id.toString()) continue;

        const encryptedData = Buffer.from(ipfsData.encryptedData, "base64");
        const iv = Buffer.from(ipfsData.iv, "base64");
        const authTag = Buffer.from(ipfsData.tag, "base64");
        const algorithm = ipfsData.algorithm || "AES-256-GCM";

        const keyBuffer = Buffer.from(student.encryptionKey, "base64");
        const decipher = crypto.createDecipheriv(algorithm.toLowerCase(), keyBuffer, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedData);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        const base64Pdf = decrypted.toString("base64");

        results.push({
          _id: req._id,
          status: req.status,
          createdAt: req.createdAt,
          student: { name: req.student.name, email: req.student.email },
          certificate: {
            id: req.certificate._id,
            title: req.certificate.title,
            description: req.certificate.description,
            pdf: base64Pdf,
            verifiedBy: req.certificate.verifiedBy || null,
          },
        });
      } catch (err) {
        console.error(`Failed to decrypt certificate ${req.certificate._id}:`, err);
      }
    }

    return new Response(JSON.stringify({ requests: results }), { status: 200 });
  } catch (error) {
    console.error("Error fetching requests:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// ------------------ PATCH: Mark Request as Verified ------------------
export async function PATCH(req) {
  await connectDB();

  try {
    const session = await getServerSession(authOptions);
    if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const institution = await User.findOne({ email: session.user.email.toLowerCase() });
    if (!institution || institution.role !== "institution") {
      return new Response(JSON.stringify({ error: "Only institutions can verify requests" }), { status: 403 });
    }

    const { requestId } = await req.json();
    if (!requestId) return new Response(JSON.stringify({ error: "Request ID is required" }), { status: 400 });

    const request = await VerificationRequest.findById(requestId);
    if (!request) return new Response(JSON.stringify({ error: "Verification request not found" }), { status: 404 });

    // Update the certificate's verifiedBy to institution name
    await Certificate.findByIdAndUpdate(request.certificate, { verifiedBy: institution.name });

    // Delete the verification request
    await VerificationRequest.findByIdAndDelete(requestId);

    return new Response(JSON.stringify({ success: true, message: "Certificate verified successfully" }), { status: 200 });

  } catch (error) {
    console.error("Error verifying request:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// ------------------ DELETE: Reject Verification Request ------------------
export async function DELETE(req) {
  await connectDB();

  try {
    const session = await getServerSession(authOptions);
    if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const institution = await User.findOne({ email: session.user.email.toLowerCase() });
    if (!institution || institution.role !== "institution") {
      return new Response(JSON.stringify({ error: "Only institutions can reject requests" }), { status: 403 });
    }

    const { requestId } = await req.json();
    if (!requestId) return new Response(JSON.stringify({ error: "Request ID is required" }), { status: 400 });

    const request = await VerificationRequest.findById(requestId);
    if (!request) return new Response(JSON.stringify({ error: "Verification request not found" }), { status: 404 });

    // Delete the request without updating the certificate
    await VerificationRequest.findByIdAndDelete(requestId);

    return new Response(JSON.stringify({ success: true, message: "Request rejected successfully" }), { status: 200 });

  } catch (error) {
    console.error("Error rejecting request:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
