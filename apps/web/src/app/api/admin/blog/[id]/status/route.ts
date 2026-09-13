import { NextResponse } from "next/server";
import { ApiError, setBlogPostStatusSchema } from "@muslimspaces/shared";
import { getApiClient } from "../../../../../../lib/api-client";
import { getCurrentToken } from "../../../../../../lib/current-user";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getCurrentToken();
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const parsed = setBlogPostStatusSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.message }, { status: 400 });
  }

  try {
    const post = await getApiClient(token).blog.setStatus(id, parsed.data);
    return NextResponse.json(post);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
