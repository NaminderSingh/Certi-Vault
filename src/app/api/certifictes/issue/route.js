import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Certificate from "@/models/certificate";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route"; // adjust path if needed

import crypto from "crypto";
import axios from "axios";
import FormData from "form-data";

export async function POST(req) {
  await dbConnect();

  // Get logged-in user session (must be institution)
  const session = await getServerSession(authOptions);


  try {
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

    // Ensure student has AES key
    if (!student.encryptionKey) {
      student.encryptionKey = crypto.randomBytes(32).toString("base64"); // AES-256 key
      await student.save();
    }

    // Convert uploaded file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Encrypt the file using AES-256-GCM
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

    // Save certificate metadata in DB
    const certificate = await Certificate.create({
      student: student._id,
      title,
      description,
      ipfsCid,
      verifiedBy: session.user.name || session.user.email, // Institution identifier
      encrypted: {
        iv: iv.toString("base64"),
        tag: authTag.toString("base64"),
        algorithm: "AES-256-GCM",
        userId: student._id.toString(),
      },
    });

    return NextResponse.json({ success: true, certificate });
  } catch (err) {
    console.error("Issue error:", err);
    return NextResponse.json({ error: "Issue failed" }, { status: 500 });
  }
}
