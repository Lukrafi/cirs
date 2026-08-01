import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  return NextResponse.json({
    success: false,
    message: "Simulação de país será implementada com o seed completo. Execute o seed-world primeiro.",
  });
}