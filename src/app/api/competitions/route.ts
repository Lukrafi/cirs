import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Somente leitura: usado pelo Simulador do painel admin (GET).
// A gestão (criar/editar/excluir) de campeonatos foi removida do site.
export async function GET() {
  const competitions = await prisma.competition.findMany({
    include: { season: { include: { league: true } }, groups: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(competitions);
}
