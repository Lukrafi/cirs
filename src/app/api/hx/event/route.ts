import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, unauthorizedResponse } from "@/lib/hx-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const key = await validateApiKey(req);
  if (!key) return unauthorizedResponse();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const reportId = typeof body.reportId === "string" ? body.reportId : "";
  if (!reportId) {
    return NextResponse.json({ error: "reportId required" }, { status: 400 });
  }

  const report = await prisma.matchReport.findUnique({ where: { id: reportId } });
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  let events: unknown[];
  try {
    events = JSON.parse(report.events || "[]");
    if (!Array.isArray(events)) events = [];
  } catch {
    events = [];
  }

  events.push({
    time: typeof body.time === "string" ? body.time.slice(0, 20) : "",
    type: typeof body.type === "string" ? body.type.slice(0, 40) : "",
    msg: typeof body.msg === "string" ? body.msg.slice(0, 300) : "",
    team: typeof body.team === "number" ? Math.floor(body.team) : 0,
    timestamp: new Date().toISOString(),
  });

  await prisma.matchReport.update({
    where: { id: reportId },
    data: { events: JSON.stringify(events) },
  });

  return NextResponse.json({ success: true });
}
