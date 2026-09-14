import { spacing, Text } from "@muslimspaces/ui";
import { getApiClient } from "../../../lib/api-client";
import { getCurrentToken } from "../../../lib/current-user";
import { BlogAdminTable } from "../../../components/admin/BlogAdminTable/BlogAdminTable";
import { NewBlogPostButton } from "./NewBlogPostButton";

export default async function AdminBlogPage() {
  const token = await getCurrentToken();
  const posts = await getApiClient(token).blog.listAll();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Text size="xl" weight="bold">Blog</Text>
        <NewBlogPostButton />
      </div>
      <div style={{ marginTop: spacing.lg, overflowX: "auto" }}>
        {posts.length === 0 ? <Text>No posts yet.</Text> : <BlogAdminTable posts={posts} />}
      </div>
    </div>
  );
}
