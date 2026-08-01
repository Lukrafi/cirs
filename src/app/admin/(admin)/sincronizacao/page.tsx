import { getPermissions } from "@/lib/permissions";
import { redirect } from "next/navigation";
import CentralSincronizacao from "./CentralSincronizacao";
import { prisma } from "@/lib/prisma";
import { listAvailableSources } from "@/lib/dataSources";

export const dynamic = "force-dynamic";

export default async function SincronizacaoPage() {
  const perms = await getPermissions();
  if (!perms.isAdmin) redirect("/admin");

  const confederations = await prisma.confederation.findMany({
    orderBy: { name: "asc" },
  });

  const competitions = await prisma.competition.findMany({
    include: { season: { include: { league: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const countries = await prisma.country.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <CentralSincronizacao
      confederations={JSON.parse(JSON.stringify(confederations))}
      competitions={JSON.parse(JSON.stringify(competitions))}
      countries={JSON.parse(JSON.stringify(countries))}
      sources={listAvailableSources()}
    />
  );
}