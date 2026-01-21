import crypto from "crypto";
import bcrypt from "bcryptjs";

export function generateSixDigit() {
  // 000000–999999, always 6 characters
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function hashCode(code) {
  const saltRounds = 10;
  return bcrypt.hash(code, saltRounds);
}

export async function compareCode(code, hash) {
  return bcrypt.compare(code, hash);
}