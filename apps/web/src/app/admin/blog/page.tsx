import { Text } from "@muslimspaces/ui";
import { getApiClient } from "../../../lib/api-client";
import { getCurrentToken } from "../../../lib/current-user";
import { BlogAdminTable } from "../../../components/admin/BlogAdminTable/BlogAdminTable";
import { NewBlogPostButton } from "./NewBlogPostButton";

export default async function AdminBlogPage() {
  const token = await getCurrentToken();
  const posts = await getApiClient(token).blog.listAll();

  return (
    <div>
      <div className="flex items-center justify-between">
        <Text size="xl" weight="bold">Blog</Text>
        <NewBlogPostButton />
      </div>
      <div className="mt-lg overflow-x-auto">
        {posts.length === 0 ? <Text>No posts yet.</Text> : <BlogAdminTable posts={posts} />}
      </div>
    </div>
  );
}
