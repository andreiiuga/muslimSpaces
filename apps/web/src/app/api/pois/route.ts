import { NextResponse } from "next/server";
import { ApiError, createPoiSchema } from "@muslimspaces/shared";
import { getApiClient } from "../../../lib/api-client";
import { getCurrentToken } from "../../../lib/current-user";

// Auth-proxy for the public "Submit a place" flow — POST /pois only
// requires JwtAuthGuard on the backend (any authenticated user, not just
// moderator/admin; confirmed in apps/backend/src/pois/pois.controller.ts),
// so this is a straight pass-through, not a duplicate of
// api/admin/pois/route.ts's own auto-approval comment — regular submitters
// land as `pending` by the backend's own role logic either way.
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
