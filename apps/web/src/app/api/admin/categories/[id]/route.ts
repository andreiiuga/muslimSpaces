import { NextResponse } from "next/server";
import { ApiError, updateCategorySchema } from "@muslimspaces/shared";
import { getApiClient } from "../../../../../lib/api-client";
import { getCurrentToken } from "../../../../../lib/current-user";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getCurrentToken();
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => undefined);
  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  try {
    const category = await getApiClient(token).categories.update(id, parsed.data);
    return NextResponse.json(category);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
