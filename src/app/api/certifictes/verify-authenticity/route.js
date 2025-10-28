import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Certificate from "@/models/certificate";
import User from "@/models/user";
import SharedCertificate from "@/models/SharedCertificate";
import { createHMAC, createDocumentHash } from "@/utils/crypto";

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

    const employer = await User.findOne({ email: session.user.email.toLowerCase() });
    if (!employer || employer.role !== "employer") {
      return new Response(
        JSON.stringify({ error: "Only employers can verify certificates" }),
        { status: 403 }
      );
    }

    const { certificateId, sharedId } = await req.json();

    if (!certificateId) {
      return new Response(
        JSON.stringify({ error: "Certificate ID is required" }),
        { status: 400 }
      );
    }

    // Step-by-step verification process
    const verificationSteps = [];

    // Step 1: Fetch Certificate
    verificationSteps.push({
      step: 1,
      name: "Fetching Certificate Metadata",
      status: "loading",
      details: "Retrieving certificate information from database..."
    });

    const certificate = await Certificate.findById(certificateId).populate('student');
    
    if (!certificate) {
      verificationSteps[0].status = "failed";
      verificationSteps[0].details = "Certificate not found in database";
      return new Response(
        JSON.stringify({
          success: false,
          valid: false,
          steps: verificationSteps,
          message: "Certificate not found"
        }),
        { status: 404 }
      );
    }

    verificationSteps[0].status = "success";
    verificationSteps[0].details = `Certificate "${certificate.title}" retrieved successfully`;
    verificationSteps[0].data = {
      title: certificate.title,
      studentName: certificate.student.name,
      createdAt: certificate.createdAt
    };

    // Step 2: Check Verification Status
    verificationSteps.push({
      step: 2,
      name: "Checking Verification Status",
      status: "loading",
      details: "Verifying if certificate has been institutionally verified..."
    });

    if (!certificate.verification?.isVerified) {
      verificationSteps[1].status = "failed";
      verificationSteps[1].details = "Certificate has not been verified by any institution";
      return new Response(
        JSON.stringify({
          success: false,
          valid: false,
          steps: verificationSteps,
          message: "Certificate is not verified by any institution"
        }),
        { status: 200 }
      );
    }

    verificationSteps[1].status = "success";
    verificationSteps[1].details = `Verified by ${certificate.verification.verifiedBy.institutionName}`;
    verificationSteps[1].data = {
      institutionName: certificate.verification.verifiedBy.institutionName,
      institutionEmail: certificate.verification.verifiedBy.institutionEmail,
      verifiedAt: certificate.verification.signature.timestamp
    };

    // Step 3: Retrieve Institution's Key
    verificationSteps.push({
      step: 3,
      name: "Retrieving Institution's Verification Key",
      status: "loading",
      details: "Fetching institution's public verification key..."
    });

    const institution = await User.findById(certificate.verification.verifiedBy.institutionId);
    
    if (!institution || !institution.encryptionKey) {
      verificationSteps[2].status = "failed";
      verificationSteps[2].details = "Institution's verification key not found";
      return new Response(
        JSON.stringify({
          success: false,
          valid: false,
          steps: verificationSteps,
          message: "Institution verification key missing"
        }),
        { status: 200 }
      );
    }

    verificationSteps[2].status = "success";
    verificationSteps[2].details = `Key retrieved for ${institution.name}`;
    verificationSteps[2].data = {
      institutionName: institution.name,
      keyLength: institution.encryptionKey.length,
      keyPreview: institution.encryptionKey.substring(0, 16) + "..." // Show first 16 chars
    };

    // Step 4: Calculate Document Hash
    verificationSteps.push({
      step: 4,
      name: "Calculating Document Hash",
      status: "loading",
      details: "Computing SHA-256 hash of certificate metadata..."
    });

    const calculatedHash = createDocumentHash(
      certificate.ipfsCid,
      certificate.title,
      certificate.student._id.toString()
    );

    verificationSteps[3].status = "success";
    verificationSteps[3].details = "Document hash computed using SHA-256 algorithm";
    verificationSteps[3].data = {
      algorithm: "SHA-256",
      input: {
        ipfsCid: certificate.ipfsCid,
        title: certificate.title,
        studentId: certificate.student._id.toString()
      },
      hash: calculatedHash,
      hashPreview: calculatedHash.substring(0, 32) + "..."
    };

    // Step 5: Compare Hashes
    verificationSteps.push({
      step: 5,
      name: "Verifying Document Integrity",
      status: "loading",
      details: "Comparing calculated hash with stored hash..."
    });

    const storedHash = certificate.verification.signature.signedHash;
    const hashesMatch = calculatedHash === storedHash;

    if (!hashesMatch) {
      verificationSteps[4].status = "failed";
      verificationSteps[4].details = "Document has been tampered with! Hashes do not match.";
      verificationSteps[4].data = {
        calculatedHash: calculatedHash.substring(0, 32) + "...",
        storedHash: storedHash.substring(0, 32) + "...",
        match: false
      };
      return new Response(
        JSON.stringify({
          success: false,
          valid: false,
          steps: verificationSteps,
          message: "Document integrity check failed - certificate may have been tampered with"
        }),
        { status: 200 }
      );
    }

    verificationSteps[4].status = "success";
    verificationSteps[4].details = "✓ Hashes match! Document has not been tampered with.";
    verificationSteps[4].data = {
      calculatedHash: calculatedHash.substring(0, 32) + "...",
      storedHash: storedHash.substring(0, 32) + "...",
      match: true
    };

    // Step 6: Verify HMAC Signature
    verificationSteps.push({
      step: 6,
      name: "Verifying Digital Signature",
      status: "loading",
      details: "Validating HMAC signature using institution's key..."
    });

    const calculatedHMAC = createHMAC(calculatedHash, institution.encryptionKey);
    const storedHMAC = certificate.verification.signature.hmac;
    const signatureValid = calculatedHMAC === storedHMAC;

    if (!signatureValid) {
      verificationSteps[5].status = "failed";
      verificationSteps[5].details = "Digital signature is invalid! Certificate may be forged.";
      verificationSteps[5].data = {
        algorithm: "SHA256-HMAC",
        signatureValid: false
      };
      return new Response(
        JSON.stringify({
          success: false,
          valid: false,
          steps: verificationSteps,
          message: "Digital signature verification failed"
        }),
        { status: 200 }
      );
    }

    verificationSteps[5].status = "success";
    verificationSteps[5].details = "✓ Digital signature is valid! Certificate is authentic.";
    verificationSteps[5].data = {
      algorithm: "SHA256-HMAC",
      signatureValid: true,
      signaturePreview: calculatedHMAC.substring(0, 32) + "..."
    };

    // Step 7: Log Verification Check
    if (sharedId) {
      const sharedCert = await SharedCertificate.findById(sharedId);
      if (sharedCert) {
        sharedCert.authenticityChecks.push({
          checkedAt: new Date(),
          result: true,
          details: {
            steps: verificationSteps,
            verifiedBy: employer.name
          }
        });
        await sharedCert.save();
      }
    }

    verificationSteps.push({
      step: 7,
      name: "Verification Complete",
      status: "success",
      details: "✓ All checks passed! Certificate is authentic and verified.",
      data: {
        totalSteps: 7,
        passedSteps: 7,
        failedSteps: 0
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        valid: true,
        steps: verificationSteps,
        summary: {
          certificateTitle: certificate.title,
          studentName: certificate.student.name,
          institutionName: institution.name,
          verifiedAt: certificate.verification.signature.timestamp,
          verificationMethod: "SHA256-HMAC Digital Signature",
          result: "AUTHENTIC"
        },
        message: "Certificate is authentic and has been verified"
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error verifying certificate:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        steps: [{
          step: 0,
          name: "System Error",
          status: "failed",
          details: error.message
        }]
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}