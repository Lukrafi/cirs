import { NextResponse } from "next/server";
import { getAdminSession } from "./session";

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Não autorizado" }, { status: 401 }) };
  }
  return { session };
}