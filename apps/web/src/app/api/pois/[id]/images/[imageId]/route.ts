import { NextResponse } from "next/server";
import { ApiError } from "@muslimspaces/shared";
import { getApiClient } from "../../../../../../lib/api-client";
import { getCurrentToken } from "../../../../../../lib/current-user";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; imageId: string }> }) {
  const { id, imageId } = await params;
  const token = await getCurrentToken();
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    await getApiClient(token).pois.images.remove(id, imageId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
