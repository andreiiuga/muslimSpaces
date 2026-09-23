import { Text } from "@muslimspaces/ui";
import { BlogForm } from "../../../../components/admin/BlogForm/BlogForm";

export default function NewBlogPostPage() {
  return (
    <div>
      <Text size="xl" weight="bold">New post</Text>
      <div className="mt-xl"><BlogForm /></div>
    </div>
  );
}
