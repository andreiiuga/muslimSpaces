import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ApiError, signupSchema } from "@muslimspaces/shared";
import { getApiClient } from "../../../lib/api-client";

export async function POST(request: Request) {
  const body = await request.json().catch(() => undefined);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  try {
    const api = getApiClient();
    const { accessToken } = await api.auth.signup(parsed.data);

    // Same httpOnly cookie as /api/login — signup logs the user in immediately.
    (await cookies()).set("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
