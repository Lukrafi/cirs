import { NextRequest, NextResponse } from "next/server";
import { loginAdmin } from "@/lib/session";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!rateLimit(`login:${ip}`, 10, 15 * 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas de login. Tente novamente mais tarde." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }

  const session = await loginAdmin(username, password);
  if (!session) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}
