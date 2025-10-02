import mongoose from "mongoose";

const VerificationRequestSchema = new mongoose.Schema(
  {
    certificate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Certificate",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    remarks: {
      type: String, // optional message by institution
      trim: true,
    },
  },
  { timestamps: true }
);

// 🔎 Indexes for faster queries
VerificationRequestSchema.index({ student: 1, certificate: 1 });
VerificationRequestSchema.index({ institution: 1, status: 1 });

export default mongoose.models.VerificationRequest ||
  mongoose.model("VerificationRequest", VerificationRequestSchema);
