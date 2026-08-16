import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { readJsonBody } from "@/lib/readBody";

export const dynamic = "force-dynamic";

const MATCH_FIELDS = [
  "groupId",
  "homeTeamId",
  "awayTeamId",
  "homeScore",
  "awayScore",
  "round",
  "matchDate",
  "status",
  "isKnockout",
  "isSimulated",
] as const;

function pickMatchData(body: Record<string, unknown>): Prisma.MatchUncheckedCreateInput {
  const data: Record<string, unknown> = {};
  for (const field of MATCH_FIELDS) {
    if (field in body) data[field] = body[field];
  }
  return data as Prisma.MatchUncheckedCreateInput;
}

export async function GET() {
  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true, group: { include: { competition: true } } },
    orderBy: { matchDate: "desc" },
  });
  return NextResponse.json(matches);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await readJsonBody(req);
  if (body instanceof NextResponse) return body;

  const match = await prisma.match.create({ data: pickMatchData(body) });
  return NextResponse.json(match, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await readJsonBody(req);
  if (body instanceof NextResponse) return body;

  const { id, ...data } = body;
  if (typeof id !== "string" || !id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }
  const match = await prisma.match.update({ where: { id }, data: pickMatchData(data) });
  return NextResponse.json(match);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.match.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
