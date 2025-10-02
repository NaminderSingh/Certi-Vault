import mongoose from "mongoose";

const CertificateSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    verifiedBy: {
      type: String, // stores institution name or email
      default: null,
    },
    title: { type: String, required: true }, // e.g. "B.Tech Transcript"
    description: { type: String }, // optional
    ipfsCid: { type: String, required: true }, // CID from IPFS
    encrypted: {
      iv: { type: String, required: true },
      tag: { type: String, required: true },
      algo: { type: String, default: "aes-256-gcm" },
    },
  },
  
  { timestamps: true }
);

export default mongoose.models.Certificate ||
  mongoose.model("Certificate", CertificateSchema);
