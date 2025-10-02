import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String }, // profile picture from Google/GitHub
    provider: { type: String }, // e.g. "google", "github"
    role: {
      type: String,
      enum: ["student", "institution", "employer"],
      default: null, // ⬅️ no default, user must pick role later
    },
    // direct AES key for encrypting certificates (base64)
    encryptionKey: { type: String }, // generated on first login
  },
  { timestamps: true }
);

// Prevent model overwrite in dev mode
export default mongoose.models.User || mongoose.model("User", UserSchema);
