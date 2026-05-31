import { timingSafeEqual } from "node:crypto";

function safeCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) {
    return false;
  }
  return timingSafeEqual(aBuffer, bBuffer);
}

export function isValidAdminPassword(candidate: string | null | undefined) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || !candidate) {
    return false;
  }
  return safeCompare(candidate, adminPassword);
}
