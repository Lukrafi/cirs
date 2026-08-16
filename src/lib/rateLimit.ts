type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Rate limit simples em memória (janela deslizante por chave).
// Em serverless cada instância tem memória própria; ainda assim adiciona
// uma camada de proteção contra força bruta / spam.
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
