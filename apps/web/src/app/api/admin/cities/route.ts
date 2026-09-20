import { NextResponse } from "next/server";
import { ApiError, createCitySchema } from "@muslimspaces/shared";
import { getApiClient } from "../../../../lib/api-client";
import { getCurrentToken } from "../../../../lib/current-user";

export async function POST(request: Request) {
  const token = await getCurrentToken();
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => undefined);
  const parsed = createCitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  try {
    const city = await getApiClient(token).cities.create(parsed.data);
    return NextResponse.json(city);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
