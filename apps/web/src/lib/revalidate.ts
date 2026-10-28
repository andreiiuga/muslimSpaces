import { revalidatePath, revalidateTag } from "next/cache";

export const BLOG_LIST_TAG = "blog-list";

// On-demand ISR invalidation for the public POI page, called from the
// Route Handlers that mutate a POI (or its images/hours/reviews) so edits
// show up immediately instead of waiting out `revalidate`. Only covers
// writes made through this web app — mobile writes straight to the backend
// and shows up after the time-based window.
//
// SINGLE-INSTANCE ASSUMPTION: this invalidates the local-disk ISR cache of
// the instance handling the request only; see the note in pois/[id]/page.tsx.
export function revalidatePoi(id: string) {
  revalidatePath(`/pois/${id}`);
}

// For mutations that only know a review's id, not its POI's.
export function revalidateAllPois() {
  revalidatePath("/pois/[id]", "page");
}

// Blog writes are rare and the handlers only know the post id (the slug can
// change on edit), so invalidate the list and every post page rather than
// tracking slugs.
export function revalidateBlog() {
  revalidateTag(BLOG_LIST_TAG);
  revalidatePath("/blog/[slug]", "page");
}
