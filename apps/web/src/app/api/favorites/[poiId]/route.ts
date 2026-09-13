import { NextResponse } from "next/server";
import { ApiError } from "@muslimspaces/shared";
import { getApiClient } from "../../../../lib/api-client";
import { getCurrentToken } from "../../../../lib/current-user";

// Thin auth-proxy: client components can't read the httpOnly cookie, so
// favorite/unfavorite from the browser goes through here instead of
// hitting the backend directly.
export async function POST(_request: Request, { params }: { params: Promise<{ poiId: string }> }) {
  const { poiId } = await params;
  const token = await getCurrentToken();
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const favorite = await getApiClient(token).pois.favorite.add(poiId);
    return NextResponse.json(favorite);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ poiId: string }> }) {
  const { poiId } = await params;
  const token = await getCurrentToken();
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    await getApiClient(token).pois.favorite.remove(poiId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
