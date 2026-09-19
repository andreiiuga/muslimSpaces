import type { Metadata } from "next";
import { getApiClient } from "../../lib/api-client";
import { BlogListView } from "../../components/BlogListView/BlogListView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog — MuslimSpaces",
  description: "News, guides, and community stories for Muslims in Romania.",
};

export default async function BlogListPage() {
  const posts = await getApiClient().blog.list();
  return <BlogListView posts={posts} />;
}
