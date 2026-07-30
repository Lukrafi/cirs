import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function validateApiKey(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) return null;

  const key = await prisma.apiKey.findUnique({
    where: { key: apiKey, active: true },
  });
  return key;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}