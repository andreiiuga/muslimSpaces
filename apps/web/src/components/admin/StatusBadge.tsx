import { Text } from "@muslimspaces/ui";

/**
 * A colored status word in an admin table cell (POI pending/approved/
 * rejected, blog published/draft, review published/hidden, POI visibility
 * visible/hidden) — previously each *AdminTable.tsx re-implemented this as
 * its own inline `<Text color={...} weight="medium">` call. The color→label
 * mapping stays with each caller (it's domain-specific per entity), only
 * the visual treatment is shared here.
 */
export function StatusBadge({ color, children }: { color: string; children: string }) {
  return (
    <Text size="sm" weight="medium" color={color}>
      {children}
    </Text>
  );
}
