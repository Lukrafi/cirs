import bcrypt from "bcryptjs";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "cirs2024";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export const ADMIN_DEFAULT_PASSWORD = ADMIN_PASSWORD;
