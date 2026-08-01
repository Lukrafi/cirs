import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const allConfs = await prisma.confederation.findMany({
    include: { countries: true },
  });

  return NextResponse.json({
    success: true,
    message: "Simulação mundial será iniciada.",
    todos: allConfs.map(c => ({ name: c.name, paises: c.countries.length })),
    total: allConfs.reduce((acc, c) => acc + c.countries.length, 0),
  });
}