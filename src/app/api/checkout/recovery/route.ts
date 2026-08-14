import { NextResponse } from "next/server";
import { captureRecovery } from "@/server/checkoutRecovery";
import { recoveryLimiter } from "@/server/recoveryRate";
import type { RecoveryStep } from "@/lib/checkoutRecovery";

// Capture de la session de paiement, appelée par le tunnel dès que l'adresse
// e-mail est validée.
//
// La route répond toujours 204, même quand rien n'est écrit : elle sert un
// appel « fire and forget » du navigateur, et le client n'a aucune décision à
// prendre d'après la réponse. Elle ne révèle donc pas non plus si une adresse
// est déjà connue ou désabonnée.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const STEPS: RecoveryStep[] = ["contact", "payment", "review"];
const MAX_LINES = 40;

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "inconnu";
  if (!recoveryLimiter.check(ip)) {
    return new NextResponse(null, { status: 429 });
  }
  recoveryLimiter.register(ip);

  const payload = await request.json().catch(() => null);
  if (typeof payload !== "object" || payload === null) {
    return new NextResponse(null, { status: 204 });
  }

  const body = payload as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!EMAIL_PATTERN.test(email)) {
    return new NextResponse(null, { status: 204 });
  }

  const step = STEPS.includes(body.step as RecoveryStep) ? (body.step as RecoveryStep) : "contact";
  const locale = body.locale === "en" ? "en" : "de";

  const rawLines = Array.isArray(body.lines) ? body.lines.slice(0, MAX_LINES) : [];
  const lines = rawLines
    .map((entry) => {
      if (typeof entry !== "object" || entry === null) return null;
      const line = entry as Record<string, unknown>;
      if (typeof line.productId !== "string" || typeof line.quantity !== "number") return null;
      return { productId: line.productId, quantity: line.quantity };
    })
    .filter((line): line is { productId: string; quantity: number } => line !== null);

  if (lines.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  try {
    await captureRecovery({ email, locale, step, lines });
  } catch (error) {
    // Une panne de capture ne doit jamais remonter au tunnel : le client est en
    // train d'acheter, c'est la seule chose qui compte.
    console.error("[recovery] capture échouée:", error);
  }

  return new NextResponse(null, { status: 204 });
}
