// models/Certificate.js
import mongoose from "mongoose";

const CertificateSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true }, // e.g. "B.Tech Transcript"
    description: { type: String }, // optional
    ipfsCid: { type: String, required: true }, // CID from IPFS
    
    // Encryption data (for confidentiality - uses student's key)
    encrypted: {
      iv: { type: String, required: true },
      tag: { type: String, required: true },
      algo: { type: String, default: "aes-256-gcm" },
    },
    
    // Digital signature verification data (for authenticity)
    verification: {
      isVerified: { type: Boolean, default: false },
      verifiedBy: {
        institutionId: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "User",
          default: null 
        },
        institutionName: { type: String, default: null },
        institutionEmail: { type: String, default: null },
      },
      signature: {
        hmac: { type: String, default: null }, // HMAC signature using institution's key
        signedHash: { type: String, default: null }, // SHA256 hash of certificate data
        timestamp: { type: Date, default: null },
      },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Certificate ||
  mongoose.model("Certificate", CertificateSchema);