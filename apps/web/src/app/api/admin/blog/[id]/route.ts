import { NextResponse } from "next/server";
import { ApiError, updateBlogPostSchema } from "@muslimspaces/shared";
import { getApiClient } from "../../../../../lib/api-client";
import { getCurrentToken } from "../../../../../lib/current-user";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getCurrentToken();
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const parsed = updateBlogPostSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.message }, { status: 400 });
  }

  try {
    const post = await getApiClient(token).blog.update(id, parsed.data);
    return NextResponse.json(post);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getCurrentToken();
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    await getApiClient(token).blog.remove(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
