import { NextRequest, NextResponse } from "next/server";

// Lê o corpo JSON de forma segura. Retorna o objeto do body ou uma
// NextResponse de erro (400) quando o JSON está malformado.
// O tipo é `any` de propósito para manter compatibilidade com os
// `create({ data: body })` dos CRUDs existentes.
export async function readJsonBody(
  req: NextRequest
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any | NextResponse> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
