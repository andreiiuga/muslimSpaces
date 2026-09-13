import { NextResponse } from "next/server";
import { ApiError, submitReviewSchema } from "@muslimspaces/shared";
import { getApiClient } from "../../../../lib/api-client";
import { getCurrentToken } from "../../../../lib/current-user";

// Thin auth-proxy — same reasoning as /api/favorites: client components
// can't read the httpOnly token cookie.
export async function POST(request: Request, { params }: { params: Promise<{ poiId: string }> }) {
  const { poiId } = await params;
  const token = await getCurrentToken();
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => undefined);
  const parsed = submitReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  try {
    const review = await getApiClient(token).pois.reviews.submit(poiId, parsed.data);
    return NextResponse.json(review);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
