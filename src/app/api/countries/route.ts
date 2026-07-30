import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const countries = await prisma.country.findMany({ include: { confederation: true }, orderBy: { name: "asc" } });
  return NextResponse.json(countries);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const country = await prisma.country.create({ data: body });
  return NextResponse.json(country, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  const country = await prisma.country.update({ where: { id }, data });
  return NextResponse.json(country);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.country.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
