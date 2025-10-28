// models/SharedCertificate.js
import mongoose from "mongoose";

const SharedCertificateSchema = new mongoose.Schema(
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
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sharedAt: {
      type: Date,
      default: Date.now,
    },
    isReviewed: {
      type: Boolean,
      default: false,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
    // Track authenticity checks
    authenticityChecks: [
      {
        checkedAt: { type: Date, default: Date.now },
        result: { type: Boolean }, // true = valid, false = invalid
        details: { type: Object }, // Store verification steps
      }
    ],
  },
  { timestamps: true }
);

// Indexes for faster queries
SharedCertificateSchema.index({ employer: 1, isReviewed: 1 });
SharedCertificateSchema.index({ student: 1, employer: 1 });
SharedCertificateSchema.index({ certificate: 1, employer: 1 });

// Prevent model overwrite in dev mode
if (mongoose.models.SharedCertificate) {
  delete mongoose.models.SharedCertificate;
}

export default mongoose.model("SharedCertificate", SharedCertificateSchema);