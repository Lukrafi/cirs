import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { verifyPassword } from "./auth";

const ADMIN_COOKIE = "cirs_admin_session";

export type AdminSession = {
  id: string;
  username: string;
};

export async function createAdminSession(id: string, username: string) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, `${id}:${username}`, {
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

  const [id, username] = cookie.value.split(":");
  if (!id || !username) return null;

  const admin = await prisma.admin.findUnique({ where: { id } });
  if (!admin || admin.username !== username) return null;

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
