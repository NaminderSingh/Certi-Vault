// models/User.js
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
      default: null, // user must pick role later
    },
    // Single AES key for all operations (encryption + HMAC signing)
    // Generated on first login for all users (base64 encoded)
    encryptionKey: { type: String },
  },
  { timestamps: true }
);

// Prevent model overwrite in dev mode
export default mongoose.models.User || mongoose.model("User", UserSchema);