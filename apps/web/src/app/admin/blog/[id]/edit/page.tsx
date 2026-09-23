import { notFound } from "next/navigation";
import { Text } from "@muslimspaces/ui";
import { getApiClient } from "../../../../../lib/api-client";
import { getCurrentToken } from "../../../../../lib/current-user";
import { BlogForm } from "../../../../../components/admin/BlogForm/BlogForm";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getCurrentToken();
  const posts = await getApiClient(token).blog.listAll();
  const post = posts.find((p) => p.id === id);
  if (!post) notFound();

  return (
    <div>
      <Text size="xl" weight="bold">Edit post</Text>
      <div className="mt-xl"><BlogForm initialPost={post} /></div>
    </div>
  );
}
