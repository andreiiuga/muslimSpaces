import { NextResponse } from "next/server";
import { ApiError } from "@muslimspaces/shared";
import { getApiClient } from "../../../lib/api-client";
import { getCurrentToken } from "../../../lib/current-user";

// Auth-proxy: forwards a browser file upload to the backend's POST /media,
// attaching the httpOnly token server-side (client JS can't read it).
export async function POST(request: Request) {
  const token = await getCurrentToken();
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
  }

  try {
    const filename = file instanceof File ? file.name : "upload";
    const result = await getApiClient(token).media.upload(file, filename);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
