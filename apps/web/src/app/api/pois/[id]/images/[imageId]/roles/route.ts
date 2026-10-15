import { NextResponse } from "next/server";
import { ApiError, setPoiImageRolesSchema } from "@muslimspaces/shared";
import { getApiClient } from "../../../../../../../lib/api-client";
import { getCurrentToken } from "../../../../../../../lib/current-user";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string; imageId: string }> }) {
  const { id, imageId } = await params;
  const token = await getCurrentToken();
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => undefined);
  const parsed = setPoiImageRolesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  try {
    const image = await getApiClient(token).pois.images.setRoles(id, imageId, parsed.data);
    return NextResponse.json(image);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
