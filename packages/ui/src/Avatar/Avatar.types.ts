export interface AvatarProps {
  uri?: string;
  /** Used to render initials when there's no image. */
  name?: string;
  size?: number;
}

export function getInitials(name: string | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1] ?? "" : "";
  const initials = last ? first.charAt(0) + last.charAt(0) : first.slice(0, 2);
  return initials.toUpperCase();
}
