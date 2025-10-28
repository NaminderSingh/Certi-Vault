// utils/crypto.js
import crypto from 'crypto';

/**
 * Generate a random AES-256 encryption key
 * Used for both encryption and HMAC signing
 */
export function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Create HMAC signature for document verification
 * @param {string} data - Data to sign (usually a hash)
 * @param {string} keyBase64 - Base64 encoded encryption key
 * @returns {string} Base64 encoded HMAC signature
 */
export function createHMAC(data, keyBase64) {
  const key = Buffer.from(keyBase64, 'base64');
  const hmac = crypto.createHmac('sha256', key);
  hmac.update(data);
  return hmac.digest('base64');
}

/**
 * Create a consistent hash of certificate metadata
 * This hash is what gets signed by the institution
 * @param {string} ipfsCid - IPFS content identifier
 * @param {string} title - Certificate title
 * @param {string} studentId - Student's MongoDB ObjectId as string
 * @returns {string} Hex encoded SHA256 hash
 */
export function createDocumentHash(ipfsCid, title, studentId) {
  const data = `${ipfsCid}|${title}|${studentId}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Verify HMAC signature
 * @param {string} data - Original data that was signed
 * @param {string} signature - HMAC signature to verify
 * @param {string} keyBase64 - Base64 encoded encryption key
 * @returns {boolean} True if signature is valid
 */
export function verifyHMAC(data, signature, keyBase64) {
  const expectedHMAC = createHMAC(data, keyBase64);
  return expectedHMAC === signature;
}