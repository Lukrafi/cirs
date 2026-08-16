import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { readJsonBody } from "@/lib/readBody";

export const dynamic = "force-dynamic";

export async function GET() {
  const countries = await prisma.country.findMany({ include: { confederation: true }, orderBy: { name: "asc" } });
  return NextResponse.json(countries);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const body = await readJsonBody(req);
  if (body instanceof NextResponse) return body;
  if (!body.code) {
    body.code = (body.name || "XX").substring(0, 3).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
  }
  const country = await prisma.country.create({ data: body });
  return NextResponse.json(country, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const body = await readJsonBody(req);
  if (body instanceof NextResponse) return body;
  const { id, ...data } = body;
  if (!data.code) delete data.code;
  const country = await prisma.country.update({ where: { id }, data });
  return NextResponse.json(country);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.country.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
