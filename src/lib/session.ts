import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "./prisma";
import { verifyPassword } from "./auth";

const ADMIN_COOKIE = "cirs_admin_session";

function sessionSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "cirs-insecure-dev-secret-change-me"
  );
}

export type AdminSession = {
  id: string;
  username: string;
};

export function signSessionValue(id: string, username: string): string {
  const payload = `${id}.${username}`;
  const sig = createHmac("sha256", sessionSecret())
    .update(payload)
    .digest("hex");
  return `${payload}.${sig}`;
}

export function parseSignedSession(value: string): { id: string; username: string } | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [id, username, sig] = parts;
  if (!id || !username || !sig) return null;

  const expected = createHmac("sha256", sessionSecret())
    .update(`${id}.${username}`)
    .digest("hex");

  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(sig, "hex");
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;

  return { id, username };
}

export async function createAdminSession(id: string, username: string) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, signSessionValue(id, username), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(ADMIN_COOKIE);
  if (!cookie) return null;

  const parsed = parseSignedSession(cookie.value);
  if (!parsed) return null;

  const admin = await prisma.admin.findUnique({ where: { id: parsed.id } });
  if (!admin || admin.username !== parsed.username) return null;

  return { id: admin.id, username: admin.username };
}

export async function loginAdmin(username: string, password: string): Promise<AdminSession | null> {
  const admin = await prisma.admin.findUnique({ where: { username } });
  if (!admin) return null;

  const ok = await verifyPassword(password, admin.password);
  if (!ok) return null;

  await createAdminSession(admin.id, admin.username);
  return { id: admin.id, username: admin.username };
}
