import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createSessionToken,
} from "@/lib/adminAuth";
import { markAdminLoggedIn } from "@/server/admins";
import { verifyLoginChallenge } from "@/server/adminOtp";

/**
 * Second facteur : le code reçu par e-mail. C'est la seule route qui pose le
 * cookie de session du back-office.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const challengeId = typeof body?.challengeId === "string" ? body.challengeId : "";
  const code = typeof body?.code === "string" ? body.code : "";

  if (!challengeId || !code) {
    return NextResponse.json({ error: "Code manquant." }, { status: 400 });
  }

  const result = await verifyLoginChallenge(challengeId, code);

  if (result.status === "expired") {
    return NextResponse.json(
      { error: "Code expiré ou trop de tentatives. Recommencez la connexion.", restart: true },
      { status: 401 },
    );
  }

  if (result.status === "invalid") {
    return NextResponse.json(
      {
        error: `Code incorrect. Il reste ${result.attemptsLeft} tentative${
          result.attemptsLeft > 1 ? "s" : ""
        }.`,
      },
      { status: 401 },
    );
  }

  await markAdminLoggedIn(result.user.id);

  const token = createSessionToken(result.user.email, result.user.id);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });

  return NextResponse.json({
    success: true,
    user: { name: result.user.name, email: result.user.email },
  });
}
