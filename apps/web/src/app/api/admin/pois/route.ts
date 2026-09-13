import { NextResponse } from "next/server";
import { ApiError, createPoiSchema } from "@muslimspaces/shared";
import { getApiClient } from "../../../../lib/api-client";
import { getCurrentToken } from "../../../../lib/current-user";

// Auth-proxy for admin POI creation. The backend's own role logic handles
// auto-approval for moderator/admin submitters — nothing extra needed here.
export async function POST(request: Request) {
  const token = await getCurrentToken();
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => undefined);
  const parsed = createPoiSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  try {
    const poi = await getApiClient(token).pois.create(parsed.data);
    return NextResponse.json(poi);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
