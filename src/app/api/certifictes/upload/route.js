import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Certificate from "@/models/certificate";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

import crypto from "crypto";
import axios from "axios";
import FormData from "form-data";
import { generateEncryptionKey } from "@/utils/crypto";

export async function POST(req) {
  await dbConnect();

  // Get logged-in user session (must be student)
  const session = await getServerSession(authOptions);
  try {
    // Get student details
   const student = await User.findOne({ email: session.user.email.toLowerCase() });
    
    if (!student || student.role !== "student") {
      return NextResponse.json(
        { error: "Only students can upload certificates" },
        { status: 403 }
      );
    }

    // Ensure student has encryption key
    if (!student.encryptionKey) {
      student.encryptionKey = generateEncryptionKey();
      await student.save();
    }

    // Parse form data
    const formData = await req.formData();
    const title = formData.get("title");
    const description = formData.get("description");
    const file = formData.get("file");

    if (!title || !file) {
      return NextResponse.json(
        { error: "Title and file are required." },
        { status: 400 }
      );
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

    // ✅ Save certificate metadata in DB (UNVERIFIED by default)
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
      // ✅ Not verified - student needs to request verification from institution
      verification: {
        isVerified: false,
        verifiedBy: {
          institutionId: null,
          institutionName: null,
          institutionEmail: null,
        },
        signature: {
          hmac: null,
          signedHash: null,
          timestamp: null,
        },
      },
    });

    return NextResponse.json({
      success: true,
      certificate,
      message: "Certificate uploaded successfully. Request verification from an institution.",
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Upload failed", details: err.message },
      { status: 500 }
    );
  }
}
// ```

// **Key Changes:**

// 1. ✅ **Student authentication** - Verify logged-in user is a student
// 2. ✅ **Student role validation** - Only students can upload via this endpoint
// 3. ✅ **Removed studentEmail field** - Student uploads for themselves (from session)
// 4. ✅ **Certificate defaults to UNVERIFIED** - `isVerified: false`, all signature fields are `null`
// 5. ✅ **Import updated crypto function** - `generateEncryptionKey` from `@/utils/crypto`
// 6. ✅ **Helpful message** - Tells student to request verification

// **Flow:**
// ```
// Student uploads → Encrypts with their own key → Uploads to IPFS → 
// Saves as UNVERIFIED → Student can now send verification request to institution