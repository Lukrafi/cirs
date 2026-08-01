import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const confederationId = searchParams.get("id");
  if (!confederationId) return NextResponse.json({ error: "confederationId é obrigatório" }, { status: 400 });

  const confed = await prisma.confederation.findUnique({
    where: { id: confederationId },
    include: { countries: true },
  });
  if (!confed) return NextResponse.json({ error: "Confederação não encontrada" }, { status: 404 });

  return NextResponse.json({
    success: true,
    message: `Simulação da confederação ${confed.name} com ${confed.countries.length} países será iniciada.`,
    countries: confed.countries.map(c => ({ id: c.id, name: c.name })),
  });
}