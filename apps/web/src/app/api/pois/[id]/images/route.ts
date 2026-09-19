import { NextResponse } from "next/server";
import { ApiError, attachPoiImageSchema } from "@muslimspaces/shared";
import { getApiClient } from "../../../../../lib/api-client";
import { getCurrentToken } from "../../../../../lib/current-user";

// Auth-proxy for the "Submit a place" flow's photo step — POST
// /pois/:id/images only requires JwtAuthGuard (any authenticated user).
// The actual file upload happens against api/media/route.ts first (already
// generic, reused as-is); this just attaches the resulting storageKey.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getCurrentToken();
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => undefined);
  const parsed = attachPoiImageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  try {
    const image = await getApiClient(token).pois.images.attach(id, parsed.data);
    return NextResponse.json(image);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
