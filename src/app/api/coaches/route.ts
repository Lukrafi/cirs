import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const coaches = await prisma.coach.findMany({ include: { club: true }, orderBy: { name: "asc" } });
  return NextResponse.json(coaches);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const coach = await prisma.coach.create({ data: body });
  return NextResponse.json(coach, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  const coach = await prisma.coach.update({ where: { id }, data });
  return NextResponse.json(coach);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.coach.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
