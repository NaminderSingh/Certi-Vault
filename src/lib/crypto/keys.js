import crypto from "crypto";

/**
 * Generate a random AES-256 key for user (raw Buffer)
 * Returns base64 string to store in DB
 */
export function generateUserAesKey() {
  return crypto.randomBytes(32).toString("base64"); // 256-bit key
}
