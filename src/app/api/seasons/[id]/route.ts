import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  const season = await prisma.season.findUnique({
    where: { id },
    include: {
      competitions: {
        include: {
          groups: {
            include: {
              standings: { select: { id: true, clubId: true } },
              matches: { select: { id: true, status: true, round: true } },
            },
          },
        },
      },
    },
  });

  if (!season) return NextResponse.json({ error: "Season not found" }, { status: 404 });

  if (action === "validate") {
    const pending: { name: string; reason: string }[] = [];

    for (const comp of season.competitions) {
      const allMatches = comp.groups.flatMap((g) => g.matches);
      const scheduled = allMatches.filter((m) => m.status === "scheduled");

      if (scheduled.length > 0) {
        pending.push({
          name: comp.name,
          reason: `${scheduled.length} partida(s) pendente(s)`,
        });
      }

      if (comp.groups.length === 0) {
        pending.push({ name: comp.name, reason: "Sem grupos ou calendario gerado" });
      }

      const totalStandings = comp.groups.reduce((s, g) => g.standings.length, 0);
      if (totalStandings === 0) {
        pending.push({ name: comp.name, reason: "Sem clubes definidos" });
      }
    }

    const canAdvance = pending.length === 0;

    return NextResponse.json({
      canAdvance,
      pending,
      pendingCount: pending.length,
      totalCompetitions: season.competitions.length,
    });
  }

  return NextResponse.json(season);
}
