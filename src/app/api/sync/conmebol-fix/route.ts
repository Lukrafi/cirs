import { NextRequest, NextResponse } from "next/server";
import { getPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  const perms = await getPermissions();
  if (!perms.canSyncData) {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  try {
    const confed = await prisma.confederation.findFirst({ where: { code: "CONMEBOL" } });
    if (!confed) {
      return NextResponse.json({ error: "CONMEBOL nao encontrada" }, { status: 400 });
    }

    const orphanClubsBefore = await prisma.club.count({ where: { countryId: null } });
    const orphanDivsBefore = await prisma.division.count({ where: { countryId: null } });

    const orphanClubs = await prisma.club.findMany({
      where: { countryId: null },
      select: { id: true, name: true, divisionId: true },
    });

    let deletedClubs = 0;
    let mergedClubs = 0;
    const mergeDetails: string[] = [];

    for (const orphan of orphanClubs) {
      try {
        const dup = await prisma.club.findFirst({
          where: {
            name: orphan.name,
            countryId: { not: null },
          },
        });

        if (dup) {
          await prisma.standing.updateMany({
            where: { clubId: orphan.id },
            data: { clubId: dup.id },
          });
          await prisma.match.updateMany({
            where: { OR: [{ homeTeamId: orphan.id }, { awayTeamId: orphan.id }] },
            data: {
              homeTeamId: { set: undefined },
              awayTeamId: { set: undefined },
            },
          }).catch(() => {});
          await prisma.club.delete({ where: { id: orphan.id } });
          mergedClubs++;
          mergeDetails.push(`merged orphan "${orphan.name}" into existing club`);
        } else {
          await prisma.standing.deleteMany({ where: { clubId: orphan.id } });
          await prisma.club.delete({ where: { id: orphan.id } });
          deletedClubs++;
        }
      } catch (e) {
        mergeDetails.push(`error with "${orphan.name}": ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    await prisma.division.deleteMany({ where: { countryId: null } });

    await prisma.league.updateMany({
      where: { countryId: null, confederationId: confed.id },
      data: { countryId: confed.id ? null : undefined },
    });

    return NextResponse.json({
      orphanClubsBefore,
      orphanDivsBefore,
      mergedClubs,
      deletedClubs,
      mergeDetails: mergeDetails.slice(0, 30),
      message: "Limpeza concluida. Execute /api/sync/import-json novamente.",
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}