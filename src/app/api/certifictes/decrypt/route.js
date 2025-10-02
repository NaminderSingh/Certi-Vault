import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Certificate from "@/models/certificate";
import crypto from "crypto";

export async function POST(req) {
  await connectDB();

  try {
    const session = await getServerSession(authOptions);
    if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const { ipfsCid } = await req.json();
    console.log(ipfsCid);
    if (!ipfsCid) return new Response(JSON.stringify({ error: "ipfsCid is required" }), { status: 400 });

    // fetch certificate from DB
    const cert = await Certificate.findOne({ ipfsCid }).populate("student");
    if (!cert) return new Response(JSON.stringify({ error: "Certificate not found" }), { status: 404 });

    if (cert.student.email !== session.user.email) {
      return new Response(JSON.stringify({ error: "User mismatch. You cannot decrypt this certificate." }), { status: 403 });
    }

    // fetch encrypted data from IPFS
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsCid}`;
    const response = await fetch(ipfsUrl, { headers: { "Accept": "application/json" } });
    if (!response.ok) return new Response(JSON.stringify({ error: "Failed to fetch from IPFS" }), { status: 500 });

    const ipfsData = await response.json();

    const encryptedData = Buffer.from(ipfsData.encryptedData, "base64");
    const iv = Buffer.from(ipfsData.iv || cert.encrypted.iv, "base64");
    const authTag = Buffer.from(ipfsData.tag || cert.encrypted.tag, "base64");
    const algorithm = ipfsData.algorithm || cert.encrypted.algo || "aes-256-gcm";

    const keyBuffer = Buffer.from(cert.student.encryptionKey, "base64");
    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    const base64Pdf = decrypted.toString("base64");

    return new Response(JSON.stringify({ pdf: base64Pdf }), { status: 200 });

  } catch (error) {
    console.error("Decryption error:", error);
    return new Response(JSON.stringify({ error: "Failed to decrypt certificate" }), { status: 500 });
  }
}
