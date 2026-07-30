import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, unauthorizedResponse } from "@/lib/hx-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const key = await validateApiKey(req);
  if (!key) return unauthorizedResponse();

  const body = await req.json();
  const { reportId, type, time, msg, team } = body;

  if (!reportId) {
    return NextResponse.json({ error: "reportId required" }, { status: 400 });
  }

  const report = await prisma.matchReport.findUnique({ where: { id: reportId } });
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const events = JSON.parse(report.events || "[]");
  events.push({ time, type, msg, team, timestamp: new Date().toISOString() });

  await prisma.matchReport.update({
    where: { id: reportId },
    data: { events: JSON.stringify(events) },
  });

  return NextResponse.json({ success: true });
}