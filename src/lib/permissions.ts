import { cookies } from "next/headers";
import { prisma } from "./prisma";

export type Role = "admin" | "moderator" | "user";

export type Permissions = {
  role: Role;
  canSimulateWorld: boolean;
  canSimulateConfederation: boolean;
  canSimulateCountry: boolean;
  canEditCompetitions: boolean;
  canEditClubs: boolean;
  canEditForces: boolean;
  canEditCalendars: boolean;
  canEditResults: boolean;
  canFixMatches: boolean;
  canUpdateClubs: boolean;
  canSyncData: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isUser: boolean;
};

const NO_PERMISSIONS: Permissions = {
  role: "user",
  canSimulateWorld: false,
  canSimulateConfederation: false,
  canSimulateCountry: false,
  canEditCompetitions: false,
  canEditClubs: false,
  canEditForces: false,
  canEditCalendars: false,
  canEditResults: false,
  canFixMatches: false,
  canUpdateClubs: false,
  canSyncData: false,
  isAdmin: false,
  isModerator: false,
  isUser: true,
};

const ADMIN_PERMISSIONS: Permissions = {
  role: "admin",
  canSimulateWorld: true,
  canSimulateConfederation: true,
  canSimulateCountry: true,
  canEditCompetitions: true,
  canEditClubs: true,
  canEditForces: true,
  canEditCalendars: true,
  canEditResults: true,
  canFixMatches: true,
  canUpdateClubs: true,
  canSyncData: true,
  isAdmin: true,
  isModerator: false,
  isUser: false,
};

const MODERATOR_PERMISSIONS: Permissions = {
  role: "moderator",
  canSimulateWorld: false,
  canSimulateConfederation: false,
  canSimulateCountry: false,
  canEditCompetitions: false,
  canEditClubs: false,
  canEditForces: false,
  canEditCalendars: false,
  canEditResults: true,
  canFixMatches: true,
  canUpdateClubs: true,
  canSyncData: false,
  isAdmin: false,
  isModerator: true,
  isUser: false,
};

function permissionsForRole(role: string): Permissions {
  switch (role) {
    case "admin":
      return ADMIN_PERMISSIONS;
    case "moderator":
      return MODERATOR_PERMISSIONS;
    default:
      return NO_PERMISSIONS;
  }
}

export async function getPermissions(): Promise<Permissions> {
  const cookieStore = await cookies();

  const adminCookie = cookieStore.get("cirs_admin_session");
  if (adminCookie) {
    const [id, username] = adminCookie.value.split(":");
    if (id && username) {
      const admin = await prisma.admin.findUnique({ where: { id } });
      if (admin && admin.username === username) {
        return ADMIN_PERMISSIONS;
      }
    }
  }

  const userCookie = cookieStore.get("cirs_user_session");
  if (userCookie) {
    const userId = userCookie.value;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      return permissionsForRole(user.role);
    }
  }

  return NO_PERMISSIONS;
}

export async function getUserSession(): Promise<{ id: string; username: string; role: Role } | null> {
  const cookieStore = await cookies();

  const adminCookie = cookieStore.get("cirs_admin_session");
  if (adminCookie) {
    const [id, username] = adminCookie.value.split(":");
    if (id && username) {
      const admin = await prisma.admin.findUnique({ where: { id } });
      if (admin && admin.username === username) {
        return { id: admin.id, username: admin.username, role: "admin" };
      }
    }
  }

  const userCookie = cookieStore.get("cirs_user_session");
  if (userCookie) {
    const userId = userCookie.value;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      return { id: user.id, username: user.username, role: user.role as Role };
    }
  }

  return null;
}
