import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const count = await prisma.club.count();
    return Response.json({
      ok: true,
      clubCount: count,
      dbUrl: (process.env.DATABASE_URL || "").substring(0, 30) + "...",
    });
  } catch (e) {
    return Response.json({
      ok: false,
      error: String(e),
      dbUrl: (process.env.DATABASE_URL || "").substring(0, 30) + "...",
    }, { status: 500 });
  }
}
