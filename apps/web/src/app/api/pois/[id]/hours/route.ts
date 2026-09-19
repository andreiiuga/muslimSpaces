import { NextResponse } from "next/server";
import { ApiError, setPoiHoursSchema } from "@muslimspaces/shared";
import { getApiClient } from "../../../../../lib/api-client";
import { getCurrentToken } from "../../../../../lib/current-user";

// Auth-proxy for the "Submit a place" flow's hours step — PUT
// /pois/:id/hours only requires JwtAuthGuard (any authenticated user).
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getCurrentToken();
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => undefined);
  const parsed = setPoiHoursSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  try {
    const hours = await getApiClient(token).pois.hours.set(id, parsed.data);
    return NextResponse.json(hours);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
