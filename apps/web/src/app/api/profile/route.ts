import { NextResponse } from "next/server";
import { ApiError, updateProfileSchema } from "@muslimspaces/shared";
import { getApiClient } from "../../../lib/api-client";
import { getCurrentToken } from "../../../lib/current-user";

export async function PATCH(request: Request) {
  const token = await getCurrentToken();
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => undefined);
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  try {
    const user = await getApiClient(token).auth.updateProfile(parsed.data);
    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
