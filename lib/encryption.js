import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from "crypto";

function getKey() {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex) {
    const err = new Error(
      "ENCRYPTION_KEY is missing. Add a 32-byte hex string to .env.local"
    );
    err.code = "ENCRYPTION_KEY_MISSING";
    throw err;
  }
  const key = Buffer.from(hex, "hex");
  if (key.length !== 32) {
    const err = new Error("ENCRYPTION_KEY must be 32 bytes (64 hex chars)");
    err.code = "ENCRYPTION_KEY_INVALID";
    throw err;
  }
  return key;
}

export function encrypt(value) {
  const key = getKey();
  const iv = randomBytes(12); // GCM recommended
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.isBuffer(value)
    ? value
    : Buffer.from(String(value), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Store as raw bytes: [iv | tag | ciphertext]
  return Buffer.concat([iv, tag, ciphertext]);
}

export function decrypt(buf) {
  const key = getKey();
  const data = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  if (data.length < 12 + 16) {
    const err = new Error("Encrypted payload too short");
    err.code = "ENCRYPTION_INVALID_INPUT";
    throw err;
  }
  const iv = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const ciphertext = data.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
