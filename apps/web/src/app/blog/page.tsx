import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { getApiClient } from "../../lib/api-client";
import { BLOG_LIST_TAG } from "../../lib/revalidate";
import { BlogListView } from "../../components/BlogListView/BlogListView";

// Not ISR like /blog/[slug]: a route with no params is prerendered at
// build time, and the Docker build on Railway has no backend to fetch from
// (and a flaky one would bake an error/empty list into the cache). So the
// page renders per request and only the data is cached (1h, or until
// revalidateBlog() runs). Must stay free of cookies()/headers() anyway.
//
// SINGLE-INSTANCE ASSUMPTION: unstable_cache lives on this instance's disk,
// same caveat as the ISR cache elsewhere.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog — MuslimSpaces",
  description: "News, guides, and community stories for Muslims in Romania.",
};

const getPosts = unstable_cache(() => getApiClient().blog.list(), ["blog-list"], {
  revalidate: 3600,
  tags: [BLOG_LIST_TAG],
});

export default async function BlogListPage() {
  const posts = await getPosts();
  return <BlogListView posts={posts} />;
}
