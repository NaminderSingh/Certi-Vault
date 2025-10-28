import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Certificate from "@/models/certificate";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

import crypto from "crypto";
import axios from "axios";
import FormData from "form-data";
import { generateEncryptionKey, createHMAC, createDocumentHash } from "@/utils/crypto";

export async function POST(req) {
  await dbConnect();

  // Get logged-in user session (must be institution)
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get institution details
    const institution = await User.findOne({ email: session.user.email.toLowerCase() });
    
    if (!institution || institution.role !== "institution") {
      return NextResponse.json(
        { error: "Only institutions can upload certificates" },
        { status: 403 }
      );
    }

    // Ensure institution has encryption key
    if (!institution.encryptionKey) {
      institution.encryptionKey = generateEncryptionKey();
      await institution.save();
    }

    // Parse form data
    const formData = await req.formData();
    const studentEmail = formData.get("studentEmail");
    const title = formData.get("title");
    const description = formData.get("description");
    const file = formData.get("file");

    if (!studentEmail || !title || !file) {
      return NextResponse.json(
        { error: "Student email, title, and file are required." },
        { status: 400 }
      );
    }

    // Find student
    let student = await User.findOne({ email: studentEmail.toLowerCase() });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (student.role !== "student") {
      return NextResponse.json(
        { error: "Target user must be a student" },
        { status: 400 }
      );
    }

    // Ensure student has AES key
    if (!student.encryptionKey) {
      student.encryptionKey = generateEncryptionKey();
      await student.save();
    }

    // Convert uploaded file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Encrypt the file using AES-256-GCM with student's key
    const iv = crypto.randomBytes(12);
    const keyBuffer = Buffer.from(student.encryptionKey, "base64");
    const cipher = crypto.createCipheriv("aes-256-gcm", keyBuffer, iv);

    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Prepare JSON data for IPFS upload
    const dataToUpload = {
      encryptedData: encrypted.toString("base64"),
      iv: iv.toString("base64"),
      tag: authTag.toString("base64"),
      algorithm: "AES-256-GCM",
      userId: student._id.toString(),
    };

    const jsonData = JSON.stringify(dataToUpload);
    const bufferData = Buffer.from(jsonData, "utf-8");

    // Upload JSON to IPFS via Pinata
    const ipfsForm = new FormData();
    ipfsForm.append("file", bufferData, {
      filename: "encrypted-certificate.json",
      contentType: "application/json",
    });

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      ipfsForm,
      {
        headers: {
          pinata_api_key: process.env.PINATA_API_KEY,
          pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
          ...ipfsForm.getHeaders(),
        },
      }
    );

    const ipfsCid = response.data.IpfsHash;

    // ✅ CREATE DIGITAL SIGNATURE
    // Since institution is uploading directly, certificate is auto-verified
    const documentHash = createDocumentHash(
      ipfsCid,
      title,
      student._id.toString()
    );

    const hmacSignature = createHMAC(documentHash, institution.encryptionKey);

    // Save certificate metadata in DB with automatic verification
    const certificate = await Certificate.create({
      student: student._id,
      title,
      description,
      ipfsCid,
      encrypted: {
        iv: iv.toString("base64"),
        tag: authTag.toString("base64"),
        algo: "aes-256-gcm",
      },
      // ✅ Auto-verified with institution's digital signature
      verification: {
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
      },
    });

    return NextResponse.json({
      success: true,
      certificate,
      message: "Certificate uploaded and automatically verified with digital signature",
    });
  } catch (err) {
    console.error("Institution upload error:", err);
    return NextResponse.json(
      { error: "Upload failed", details: err.message },
      { status: 500 }
    );
  }
}
// ```

// **Key Changes:**

// 1. ✅ **Authentication check** - Verify institution is logged in
// 2. ✅ **Role validation** - Only institutions can use this endpoint
// 3. ✅ **Student validation** - Ensure target user is a student
// 4. ✅ **Import crypto utilities** - `generateEncryptionKey`, `createHMAC`, `createDocumentHash`
// 5. ✅ **Generate institution key** - If institution doesn't have encryption key
// 6. ✅ **Create document hash** - SHA256(ipfsCid + title + studentId)
// 7. ✅ **Sign with HMAC** - Using institution's encryption key
// 8. ✅ **Auto-verify certificate** - Set `isVerified: true` with full signature data
// 9. ✅ **Store complete verification object** - Institution details + HMAC signature + hash + timestamp

// **Flow:**
// ```
// Institution uploads to student → Encrypts with student's key → Uploads to IPFS →
// Creates HMAC signature with institution's key → Saves as VERIFIED ✓