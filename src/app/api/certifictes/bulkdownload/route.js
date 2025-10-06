import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Certificate from "@/models/certificate";
import User from "@/models/user";
import crypto from "crypto";

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

    const userEmail = session.user.email;

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
        JSON.stringify({ error: "Only students can download their certificates" }),
        { status: 403 }
      );
    }

    const userId = dbUser._id;

    // Fetch all certificates for the student
    const certificates = await Certificate.find({ student: userId }).lean();

    if (certificates.length === 0) {
      return new Response(
        JSON.stringify({ error: "No certificates found" }),
        { status: 404 }
      );
    }

    // Decrypt all certificates
    const decryptedCertificates = [];

    for (const cert of certificates) {
      try {
        // Fetch encrypted data from IPFS
        const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${cert.ipfsCid}`;
        const response = await fetch(ipfsUrl, { 
          headers: { "Accept": "application/json" } 
        });

        if (!response.ok) {
          console.error(`Failed to fetch certificate ${cert._id} from IPFS`);
          continue; // Skip this certificate and continue with others
        }

        const ipfsData = await response.json();

        // Decrypt the certificate
        const encryptedData = Buffer.from(ipfsData.encryptedData, "base64");
        const iv = Buffer.from(ipfsData.iv || cert.encrypted.iv, "base64");
        const authTag = Buffer.from(ipfsData.tag || cert.encrypted.tag, "base64");
        const algorithm = ipfsData.algorithm || cert.encrypted.algo || "aes-256-gcm";

        const keyBuffer = Buffer.from(dbUser.encryptionKey, "base64");
        const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedData);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        const base64Pdf = decrypted.toString("base64");

        decryptedCertificates.push({
          id: cert._id,
          title: cert.title,
          description: cert.description,
          verifiedBy: cert.verifiedBy,
          createdAt: cert.createdAt,
          pdf: base64Pdf
        });

      } catch (error) {
        console.error(`Error decrypting certificate ${cert._id}:`, error);
        // Continue with other certificates even if one fails
      }
    }

    if (decryptedCertificates.length === 0) {
      return new Response(
        JSON.stringify({ error: "Failed to decrypt any certificates" }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        certificates: decryptedCertificates,
        total: decryptedCertificates.length,
        totalAttempted: certificates.length
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Bulk download error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to download certificates",
        details: error.message 
      }),
      { status: 500 }
    );
  }
}